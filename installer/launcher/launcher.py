import sys
import os
from pathlib import Path

if getattr(sys, 'frozen', False):
    os.chdir(Path(sys.executable).parent)

from license_manager import is_activated
from activation_window import ActivationWindow
from main_window import MainWindow

def main():
    install_dir = Path(os.getcwd())
    
    if not is_activated():
        activation_window = ActivationWindow()
        if not activation_window.show():
            sys.exit(1)
    
    app = MainWindow(install_dir)
    app.run()

if __name__ == '__main__':
    main()
