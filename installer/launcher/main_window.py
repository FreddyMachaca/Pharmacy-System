import tkinter as tk
from tkinter import messagebox, ttk, filedialog
from system_manager import SystemManager
import qrcode
from PIL import Image, ImageTk
import threading
import io

class MainWindow:
    def __init__(self, install_dir):
        self.system = SystemManager(install_dir)
        self.is_starting = False
        
        self.root = tk.Tk()
        self.root.title("Sistema de Farmacia Portable")
        self.root.geometry("700x700")
        self.root.minsize(650, 600)
        self.root.resizable(True, True)
        
        style = ttk.Style()
        style.theme_use('clam')
        style.configure('Status.TLabel', font=('Arial', 10), padding=5)
        
        style.configure('Start.TButton', 
                       font=('Arial', 11, 'bold'), 
                       padding=15,
                       background='#4CAF50',
                       foreground='white')
        style.map('Start.TButton',
                 background=[('active', '#45a049'), ('disabled', '#e0e0e0')],
                 foreground=[('disabled', '#9e9e9e')])
        
        style.configure('Stop.TButton', 
                       font=('Arial', 11, 'bold'), 
                       padding=15,
                       background='#f44336',
                       foreground='white')
        style.map('Stop.TButton',
                 background=[('active', '#d32f2f'), ('disabled', '#e0e0e0')],
                 foreground=[('disabled', '#9e9e9e')])
        
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        title_label = ttk.Label(main_frame, text="Sistema de Farmacia Portable", 
                                font=('Arial', 18, 'bold'))
        title_label.pack(pady=(0, 10))
        
        self.status_frame = ttk.LabelFrame(main_frame, text="Estado del Sistema", padding="15")
        self.status_frame.pack(fill=tk.X, pady=(0, 20))
        
        self.status_label = ttk.Label(self.status_frame, text="● Sistema Detenido", 
                                     foreground='red', font=('Arial', 11, 'bold'))
        self.status_label.pack()
        
        self.url_label = ttk.Label(self.status_frame, text="", 
                                   foreground='blue', font=('Arial', 9))
        self.url_label.pack(pady=(5, 0))
        
        self.progress_label = ttk.Label(self.status_frame, text="", 
                                       font=('Arial', 9), foreground='gray')
        self.progress_label.pack(pady=(5, 0))
        
        self.progress = ttk.Progressbar(self.status_frame, mode='indeterminate', length=400)
        
        self.qr_frame = ttk.Frame(self.status_frame)
        self.qr_frame.pack(pady=(10, 0))
        self.qr_label = ttk.Label(self.qr_frame)
        self.qr_label.pack()
        
        control_frame = ttk.LabelFrame(main_frame, text="Control del Sistema", padding="15")
        control_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 20))
        
        self.btn_start = tk.Button(control_frame, 
                                   text="▶ Iniciar Sistema",
                                   command=self.start_system,
                                   font=('Arial', 12, 'bold'),
                                   bg='#4CAF50',
                                   fg='white',
                                   activebackground='#45a049',
                                   activeforeground='white',
                                   relief=tk.RAISED,
                                   bd=2,
                                   height=2,
                                   cursor='hand2')
        self.btn_start.pack(fill=tk.X, pady=(0, 10))
        
        self.btn_stop = tk.Button(control_frame, 
                                  text="■ Detener Sistema",
                                  command=self.stop_system,
                                  font=('Arial', 12, 'bold'),
                                  bg='#f44336',
                                  fg='white',
                                  activebackground='#d32f2f',
                                  activeforeground='white',
                                  relief=tk.RAISED,
                                  bd=2,
                                  height=2,
                                  cursor='hand2',
                                  state=tk.DISABLED,
                                  disabledforeground='#999999')
        self.btn_stop.pack(fill=tk.X, pady=(0, 10))
        
        separator = ttk.Separator(control_frame, orient='horizontal')
        separator.pack(fill=tk.X, pady=15)
        
        data_label = ttk.Label(control_frame, text="Gestión de Datos", 
                              font=('Arial', 10, 'bold'))
        data_label.pack(pady=(0, 10))
        
        btn_backup = ttk.Button(control_frame, text="💾 Guardar Datos", 
                               command=self.backup_data)
        btn_backup.pack(fill=tk.X, pady=(0, 10))
        
        btn_restore = ttk.Button(control_frame, text="📂 Cargar Datos", 
                                command=self.restore_data)
        btn_restore.pack(fill=tk.X)
        
        footer_label = ttk.Label(main_frame, 
                                text="Sistema de Farmacia Portable © 2025 - Licenciado", 
                                font=('Arial', 8), foreground='gray')
        footer_label.pack(side=tk.BOTTOM)
        
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
    
    def generate_qr(self, url):
        try:
            qr = qrcode.QRCode(version=1, box_size=5, border=2)
            qr.add_data(url)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            img = img.resize((200, 200), Image.Resampling.LANCZOS)
            
            photo = ImageTk.PhotoImage(img)
            self.qr_label.config(image=photo)
            self.qr_label.image = photo
        except:
            pass
    
    def start_system(self):
        if self.system.running:
            messagebox.showinfo("Información", "El sistema ya está en ejecución")
            return
        
        if self.is_starting:
            return
        self.is_starting = True
        
        self.btn_start.config(state='disabled')
        self.btn_stop.config(state='disabled')
        
        self.status_label.config(text="● Iniciando servicios...", foreground='orange')
        self.progress_label.config(text="Iniciando el sistema, por favor espera...")
        self.progress.pack(pady=(5, 0))
        self.progress.start(10)
        
        threading.Thread(target=self._start_system_async, daemon=True).start()

    def _start_system_async(self):
        success, result, error_detail = self.system.start_system()
        self.root.after(0, lambda: self._handle_start_result(success, result, error_detail))

    def _handle_start_result(self, success, result, error_detail):
        self.is_starting = False
        self.progress.stop()
        self.progress.pack_forget()
        self.progress_label.config(text="")
        
        if success:
            self.status_label.config(text="● Sistema Activo", foreground='green')
            self.url_label.config(text=f"Accede desde cualquier dispositivo: {result}")
            self.generate_qr(result)
            self.btn_start.config(state=tk.DISABLED)
            self.btn_stop.config(state=tk.NORMAL)
            messagebox.showinfo(
                "Éxito",
                f"Sistema iniciado correctamente\n\n"
                f"Acceso local: {result}\n\n"
                "Los dispositivos en la misma red pueden acceder escaneando el código QR"
            )
        else:
            self.status_label.config(text="● Error al Iniciar", foreground='red')
            self.url_label.config(text="")
            self.btn_start.config(state=tk.NORMAL)
            self.btn_stop.config(state=tk.DISABLED)
            
            error_msg = f"{result}\n\n"
            if error_detail:
                error_msg += f"INFORMACIÓN TÉCNICA:\n\n{error_detail}"
            
            messagebox.showerror("Error", error_msg)
    
    def stop_system(self):
        if not self.system.running:
            messagebox.showinfo("Información", "El sistema no está en ejecución")
            return
        
        if messagebox.askyesno("Confirmar", "¿Deseas detener el sistema?"):
            self.btn_start.config(state=tk.DISABLED)
            self.btn_stop.config(state=tk.DISABLED)
            
            self.status_label.config(text="● Deteniendo servicios...", foreground='orange')
            self.progress_label.config(text="Cerrando el sistema, por favor espera...")
            self.progress.pack(pady=(5, 0))
            self.progress.start(10)
            self.root.update()
            
            self.system.stop_services()
            self.is_starting = False
            
            self.progress.stop()
            self.progress.pack_forget()
            self.progress_label.config(text="")
            
            self.status_label.config(text="● Sistema Detenido", foreground='red')
            self.url_label.config(text="")
            self.qr_label.config(image='')
            self.btn_start.config(state=tk.NORMAL)
            self.btn_stop.config(state=tk.DISABLED)
            messagebox.showinfo("Éxito", "Sistema detenido correctamente")
    
    def backup_data(self):
        destination = filedialog.askdirectory(title="Selecciona dónde guardar el respaldo")
        
        if not destination:
            return
        
        self.root.config(cursor="wait")
        self.root.update()
        
        success, result = self.system.backup_data(destination)
        
        self.root.config(cursor="")
        
        if success:
            messagebox.showinfo("Éxito", f"Respaldo creado correctamente:\n\n{result}")
        else:
            messagebox.showerror("Error", f"Error al crear respaldo:\n{result}")
    
    def restore_data(self):
        zip_path = filedialog.askopenfilename(
            title="Selecciona el archivo de respaldo",
            filetypes=[("Archivos ZIP", "*.zip"), ("Todos los archivos", "*.*")]
        )
        
        if not zip_path:
            return
        
        if not messagebox.askyesno("Confirmar", 
                                   "¿Deseas restaurar los datos?\n\n"
                                   "Los datos actuales serán reemplazados."):
            return
        
        self.root.config(cursor="wait")
        self.root.update()
        
        success, result = self.system.restore_data(zip_path)
        
        self.root.config(cursor="")
        
        if success:
            messagebox.showinfo("Éxito", result)
        else:
            messagebox.showerror("Error", f"Error al restaurar datos:\n{result}")
    
    def on_closing(self):
        if self.is_starting:
            if not messagebox.askyesno(
                "Confirmar",
                "El sistema se está iniciando.\n¿Deseas cancelar y cerrar?"
            ):
                return
        if self.system.running:
            if not messagebox.askyesno(
                "Confirmar",
                "El sistema está en ejecución.\n¿Deseas cerrarlo y detener todos los servicios?"
            ):
                return
        self.is_starting = False
        self.system.stop_services()
        self.root.destroy()
    
    def run(self):
        self.root.mainloop()
