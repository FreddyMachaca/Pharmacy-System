import os
import subprocess
import time
import socket
import webbrowser
import shutil
from pathlib import Path
import traceback

class SystemManager:
    def __init__(self, install_dir):
        self.install_dir = Path(install_dir)
        self.mariadb_dir = self.install_dir / 'mariadb'
        self.node_dir = self.install_dir / 'node'
        self.backend_dir = self.install_dir / 'backend'
        self.frontend_dir = self.install_dir / 'frontend'
        self.data_dir = self.install_dir / 'data'
        
        self.mariadb_process = None
        self.node_process = None
        self.running = False
    
    def check_port(self, port):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('127.0.0.1', port))
            sock.close()
            return result == 0
        except:
            return False
    
    def check_mariadb_ready(self):
        try:
            mysql_exe = self.mariadb_dir / 'bin' / 'mysql.exe'
            result = subprocess.run(
                [str(mysql_exe), '-u', 'root', '-e', 'SELECT 1;'],
                cwd=str(self.mariadb_dir / 'bin'),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=2,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            return result.returncode == 0
        except:
            return False
    
    def check_node_ready(self):
        try:
            import urllib.request
            req = urllib.request.Request('http://127.0.0.1:3000/api/health', method='GET')
            with urllib.request.urlopen(req, timeout=2) as response:
                return response.status == 200
        except:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex(('127.0.0.1', 3000))
                sock.close()
                return result == 0
            except:
                return False
    
    def get_local_ip(self):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"
    
    def setup_database(self):
        try:
            mysql_exe = self.mariadb_dir / 'bin' / 'mysql.exe'
            
            for _ in range(5):
                result = subprocess.run(
                    [str(mysql_exe), '-u', 'root', '-e', 'SELECT 1;'],
                    cwd=str(self.mariadb_dir / 'bin'),
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    timeout=5,
                    creationflags=subprocess.CREATE_NO_WINDOW
                )
                if result.returncode == 0:
                    break
                time.sleep(1)
            
            subprocess.run(
                [str(mysql_exe), '-u', 'root', '-e', 'CREATE DATABASE IF NOT EXISTS farmacia_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'],
                cwd=str(self.mariadb_dir / 'bin'),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=10,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            
            sql_file = self.install_dir / 'database' / 'pharmacy.sql'
            if not sql_file.exists():
                sql_file = self.install_dir / 'db' / 'pharmacy.sql'
            if sql_file.exists():
                check_result = subprocess.run(
                    [str(mysql_exe), '-u', 'root', '-e', 'USE farmacia_db; SELECT COUNT(*) FROM usuarios;'],
                    cwd=str(self.mariadb_dir / 'bin'),
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=10,
                    creationflags=subprocess.CREATE_NO_WINDOW
                )
                
                if check_result.returncode != 0:
                    with open(sql_file, 'r', encoding='utf-8') as f:
                        sql_content = f.read()
                    
                    process = subprocess.Popen(
                        [str(mysql_exe), '-u', 'root', '--default-character-set=utf8mb4'],
                        cwd=str(self.mariadb_dir / 'bin'),
                        stdin=subprocess.PIPE,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        creationflags=subprocess.CREATE_NO_WINDOW
                    )
                    process.communicate(input=sql_content.encode('utf-8'), timeout=120)
        except Exception:
            pass
    
    def start_mariadb(self):
        def kill_residual_process():
            try:
                subprocess.run(
                    ['taskkill', '/F', '/IM', 'mysqld.exe'],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    timeout=3
                )
                time.sleep(2)
            except Exception:
                pass

        def run_command(name, cmd_list, work_dir=None):
            try:
                result = subprocess.run(
                    cmd_list,
                    cwd=work_dir or str(self.mariadb_dir / 'bin'),
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=180
                )
                output = (
                    f"Comando: {name}\n"
                    f"STDERR: {result.stderr.decode('utf-8', errors='ignore')[:300]}\n"
                    f"STDOUT: {result.stdout.decode('utf-8', errors='ignore')[:300]}\n"
                    f"ExitCode: {result.returncode}"
                )
                return result.returncode == 0, output
            except Exception as exc:
                return False, f"Exception ejecutando {name}: {str(exc)}"

        def read_error_log(log_path):
            try:
                if not log_path.exists():
                    return ''
                with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
                    lines = f.readlines()
                    return ''.join(lines[-60:])
            except Exception:
                return ''

        def get_short_path(path_obj):
            try:
                import ctypes
                buffer = ctypes.create_unicode_buffer(260)
                result = ctypes.windll.kernel32.GetShortPathNameW(str(path_obj), buffer, len(buffer))
                if result != 0:
                    return buffer.value
            except Exception:
                pass
            return str(path_obj)

        def initialize_data_dir():
            try:
                if data_path.exists():
                    shutil.rmtree(data_path)
                    time.sleep(1)
                data_path.mkdir(parents=True, exist_ok=True)

                short_data = get_short_path(data_path)
                short_base = get_short_path(self.mariadb_dir)

                install_script = self.mariadb_dir / 'bin' / 'mariadb-install-db.exe'
                if not install_script.exists():
                    install_script = self.mariadb_dir / 'bin' / 'mysql_install_db.exe'
                
                if install_script.exists():
                    install_cmd = [
                        str(install_script),
                        f"--datadir={short_data}",
                        '--default-user'
                    ]
                    ok, output = run_command('mariadb-install-db', install_cmd)
                    if ok:
                        return True, "Data dir inicializado"
                    return False, f"Fallo al inicializar con mariadb-install-db:\n{output}"

                return False, "No se encontró el script de instalación de MariaDB"
            except Exception as e:
                return False, f"Exception inicializando data dir: {str(e)[:200]}"

        def launch_server(dp):
            my_ini = self.mariadb_dir / 'my.ini'
            with open(my_ini, 'w', encoding='utf-8') as f:
                f.write(f"""[mysqld]
datadir={dp}
port=3306
bind-address=0.0.0.0
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
max_connections=100
skip-grant-tables
""")

            cmd = [
                str(mariadb_exe),
                f'--defaults-file={my_ini}',
                '--console'
            ]

            try:
                proc = subprocess.Popen(
                    cmd,
                    cwd=str(self.mariadb_dir / 'bin'),
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    creationflags=subprocess.CREATE_NO_WINDOW
                )
                self.mariadb_process = proc
            except Exception as e:
                return False, f"Error lanzando MariaDB: {str(e)}", ''

            max_wait = 30
            for i in range(max_wait):
                time.sleep(1)

                if proc.poll() is not None:
                    return False, "MariaDB terminó inesperadamente", ''

                if self.check_port(3306):
                    time.sleep(1)
                    if self.check_mariadb_ready():
                        return True, "MariaDB iniciado y listo", ''
                    else:
                        return True, "MariaDB puerto activo", ''

            try:
                proc.terminate()
            except Exception:
                pass
            return False, "Timeout esperando respuesta de MariaDB", ''

        kill_residual_process()

        for _ in range(10):
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex(('127.0.0.1', 3306))
                sock.close()
                if result != 0:
                    break
                time.sleep(1)
            except Exception:
                break

        mariadb_exe = self.mariadb_dir / 'bin' / 'mysqld.exe'
        data_path = self.data_dir / 'mysql'
        ibdata_file = data_path / 'ibdata1'

        if not ibdata_file.exists():
            ok, msg = initialize_data_dir()
            if not ok:
                return False, msg

        success, message, log_tail = launch_server(data_path)
        if success:
            return True, message

        corruption_markers = ['mysql.user', 'mysql.db', 'privilege tables', 'mysql.servers']
        log_lower = log_tail.lower()
        needs_repair = any(marker in log_lower for marker in corruption_markers)

        if not needs_repair:
            return False, f"{message}\n{log_tail}"

        ok, init_msg = initialize_data_dir()
        if not ok:
            return False, init_msg

        success, message, log_tail = launch_server(data_path)
        if success:
            return True, message

        return False, f"{message}\n{log_tail}"
    
    def start_node(self):
        self.setup_database()
        
        node_exe = self.node_dir / 'node.exe'
        server_js = self.backend_dir / 'server.js'
        
        env = os.environ.copy()
        env['NODE_ENV'] = 'production'
        env['PORT'] = '3000'
        env['DB_HOST'] = 'localhost'
        env['DB_PORT'] = '3306'
        env['DB_USER'] = 'root'
        env['DB_PASSWORD'] = ''
        env['DB_NAME'] = 'farmacia_db'
        env['JWT_SECRET'] = 'pharmacy_system_key_DB76376AV567D3H87H573G'
        env['JWT_EXPIRES'] = '24h'
        
        self.node_process = subprocess.Popen(
            [str(node_exe), str(server_js)],
            cwd=str(self.backend_dir),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            creationflags=subprocess.CREATE_NO_WINDOW
        )
        
        max_wait = 15
        for i in range(max_wait):
            time.sleep(1)
            
            if self.node_process.poll() is not None:
                stderr_output = self.node_process.stderr.read().decode('utf-8', errors='ignore')
                return False, f"Node.js se cerró: {stderr_output[:200]}"
            
            if self.check_node_ready():
                return True, "Backend iniciado y respondiendo"
        
        return False, f"Timeout: Backend no respondió en {max_wait} segundos"
    
    def stop_services(self):
        if self.node_process:
            try:
                self.node_process.terminate()
                self.node_process.wait(timeout=5)
            except:
                try:
                    self.node_process.kill()
                except:
                    pass
            self.node_process = None
        
        if self.mariadb_process:
            try:
                subprocess.run(['taskkill', '/F', '/IM', 'mysqld.exe'], 
                             stdout=subprocess.DEVNULL, 
                             stderr=subprocess.DEVNULL,
                             timeout=5)
                
                for i in range(10):
                    time.sleep(0.5)
                    if not self.check_port(3306):
                        break
                
            except:
                pass
            self.mariadb_process = None
        
        self.running = False
    
    def start_system(self):
        if self.running:
            return False, "El sistema ya está en ejecución", None
        
        try:
            mariadb_ok, mariadb_msg = self.start_mariadb()
            if not mariadb_ok:
                error_detail = f"MariaDB Error: {mariadb_msg}"
                return False, "Error al iniciar la base de datos", error_detail
            
            node_ok, node_msg = self.start_node()
            if not node_ok:
                self.stop_services()
                error_detail = f"Node.js Error: {node_msg}"
                return False, "Error al iniciar el servidor backend", error_detail
            
            self.running = True
            local_ip = self.get_local_ip()
            url = f"http://{local_ip}:3000"
            
            time.sleep(1)
            
            try:
                webbrowser.open(url)
            except:
                pass
            
            return True, url, None
        except Exception as e:
            self.stop_services()
            error_detail = f"Exception: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
            return False, "Error inesperado al iniciar el sistema", error_detail
    
    def backup_data(self, destination_path):
        try:
            backup_dir = Path(destination_path) / f'backup_farmacia_{time.strftime("%Y%m%d_%H%M%S")}'
            backup_dir.mkdir(parents=True, exist_ok=True)
            
            data_backup = backup_dir / 'data'
            shutil.copytree(self.data_dir, data_backup)
            
            zip_path = shutil.make_archive(str(backup_dir), 'zip', str(backup_dir.parent), backup_dir.name)
            shutil.rmtree(backup_dir)
            
            return True, zip_path
        except Exception as e:
            return False, str(e)
    
    def restore_data(self, zip_path):
        try:
            was_running = self.running
            if was_running:
                self.stop_services()
            
            import zipfile
            temp_dir = self.install_dir / 'temp_restore'
            temp_dir.mkdir(exist_ok=True)
            
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            
            extracted_dirs = list(temp_dir.iterdir())
            if extracted_dirs:
                restore_data = extracted_dirs[0] / 'data'
                if restore_data.exists():
                    if self.data_dir.exists():
                        shutil.rmtree(self.data_dir)
                    shutil.copytree(restore_data, self.data_dir)
            
            shutil.rmtree(temp_dir)
            
            if was_running:
                time.sleep(1)
                self.start_system()
            
            return True, "Datos restaurados correctamente"
        except Exception as e:
            return False, str(e)
