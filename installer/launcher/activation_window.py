import tkinter as tk
from tkinter import messagebox, ttk
from hwid_manager import get_hwid
from license_manager import activate_license
import pyperclip

class ActivationWindow:
    def __init__(self):
        self.activated = False
        self.hwid = get_hwid()
        
        self.root = tk.Tk()
        self.root.title("Activación de Licencia - Sistema Farmacia")
        self.root.geometry("600x450")
        self.root.resizable(False, False)
        
        style = ttk.Style()
        style.theme_use('clam')
        
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        title_label = ttk.Label(main_frame, text="Sistema de Farmacia Portable", 
                                font=('Arial', 16, 'bold'))
        title_label.pack(pady=(0, 10))
        
        subtitle_label = ttk.Label(main_frame, text="Activación Requerida", 
                                   font=('Arial', 12))
        subtitle_label.pack(pady=(0, 20))
        
        info_frame = ttk.LabelFrame(main_frame, text="Paso 1: Obtén tu código de activación", 
                                    padding="15")
        info_frame.pack(fill=tk.X, pady=(0, 15))
        
        instruction_text = (
            "1. Copia el código HWID a continuación\n"
            "2. Envíalo por WhatsApp a tu proveedor\n"
            "3. Recibirás un serial de activación personalizado"
        )
        
        instruction_label = ttk.Label(info_frame, text=instruction_text, 
                                     justify=tk.LEFT, font=('Arial', 9))
        instruction_label.pack(anchor=tk.W, pady=(0, 10))
        
        hwid_frame = ttk.Frame(info_frame)
        hwid_frame.pack(fill=tk.X)
        
        hwid_label = ttk.Label(hwid_frame, text="Tu HWID:", font=('Arial', 9, 'bold'))
        hwid_label.pack(side=tk.LEFT, padx=(0, 10))
        
        self.hwid_entry = ttk.Entry(hwid_frame, width=30, font=('Courier', 10))
        self.hwid_entry.insert(0, self.hwid)
        self.hwid_entry.config(state='readonly')
        self.hwid_entry.pack(side=tk.LEFT, padx=(0, 10))
        
        copy_btn = ttk.Button(hwid_frame, text="Copiar", command=self.copy_hwid)
        copy_btn.pack(side=tk.LEFT)
        
        serial_frame = ttk.LabelFrame(main_frame, text="Paso 2: Ingresa tu serial de activación", 
                                      padding="15")
        serial_frame.pack(fill=tk.X, pady=(0, 20))
        
        serial_input_frame = ttk.Frame(serial_frame)
        serial_input_frame.pack(fill=tk.X)
        
        serial_label = ttk.Label(serial_input_frame, text="Serial:", font=('Arial', 9, 'bold'))
        serial_label.pack(side=tk.LEFT, padx=(0, 10))
        
        self.serial_entry = ttk.Entry(serial_input_frame, width=40, font=('Courier', 10))
        self.serial_entry.pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill=tk.X)
        
        activate_btn = ttk.Button(button_frame, text="Activar Licencia", 
                                 command=self.activate, style='Accent.TButton')
        activate_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        exit_btn = ttk.Button(button_frame, text="Salir", command=self.exit_app)
        exit_btn.pack(side=tk.LEFT)
        
        footer_label = ttk.Label(main_frame, 
                                text="Sistema de Farmacia Portable © 2025", 
                                font=('Arial', 8), foreground='gray')
        footer_label.pack(side=tk.BOTTOM, pady=(20, 0))
        
        self.root.protocol("WM_DELETE_WINDOW", self.exit_app)
    
    def copy_hwid(self):
        try:
            pyperclip.copy(self.hwid)
            messagebox.showinfo("Éxito", "HWID copiado al portapapeles")
        except:
            messagebox.showwarning("Advertencia", 
                                 "No se pudo copiar automáticamente.\nCopia manualmente el código.")
    
    def activate(self):
        serial = self.serial_entry.get().strip()
        
        if not serial:
            messagebox.showerror("Error", "Por favor ingresa el serial de activación")
            return
        
        current_hwid = get_hwid()
        print(f"DEBUG - HWID actual: {current_hwid}")
        print(f"DEBUG - Serial ingresado: {serial}")
        print(f"DEBUG - Verificando serial...")
        
        if activate_license(serial):
            messagebox.showinfo("Éxito", "¡Licencia activada correctamente!\n\nEl sistema se iniciará ahora.")
            self.activated = True
            self.root.destroy()
        else:
            messagebox.showerror("Error", 
                               f"Serial inválido o no corresponde a esta computadora.\n\n"
                               f"HWID esperado: {current_hwid}\n"
                               f"Serial ingresado: {serial}\n\n"
                               f"Verifica que hayas ingresado el serial correcto para este HWID.")
    
    def exit_app(self):
        if messagebox.askokcancel("Salir", "¿Deseas salir sin activar?\nEl sistema no funcionará sin licencia."):
            self.root.destroy()
    
    def show(self):
        self.root.mainloop()
        return self.activated
