import os
import json
import base64
from cryptography.fernet import Fernet
from hwid_manager import get_hwid, verify_serial

LICENSE_FILE = 'license.dat'
KEY_FILE = 'system.key'

def get_encryption_key():
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, 'rb') as f:
            return f.read()
    else:
        key = Fernet.generate_key()
        with open(KEY_FILE, 'wb') as f:
            f.write(key)
        return key

def save_license(hwid, serial):
    key = get_encryption_key()
    fernet = Fernet(key)
    
    license_data = {
        'hwid': hwid,
        'serial': serial,
        'activated': True
    }
    
    json_data = json.dumps(license_data)
    encrypted_data = fernet.encrypt(json_data.encode())
    
    with open(LICENSE_FILE, 'wb') as f:
        f.write(encrypted_data)

def load_license():
    if not os.path.exists(LICENSE_FILE):
        return None
    
    try:
        key = get_encryption_key()
        fernet = Fernet(key)
        
        with open(LICENSE_FILE, 'rb') as f:
            encrypted_data = f.read()
        
        decrypted_data = fernet.decrypt(encrypted_data)
        license_data = json.loads(decrypted_data.decode())
        
        return license_data
    except:
        return None

def is_activated():
    license_data = load_license()
    if not license_data:
        return False
    
    current_hwid = get_hwid()
    stored_hwid = license_data.get('hwid')
    stored_serial = license_data.get('serial')
    
    if current_hwid != stored_hwid:
        return False
    
    if not verify_serial(current_hwid, stored_serial):
        return False
    
    return license_data.get('activated', False)

def activate_license(serial):
    current_hwid = get_hwid()
    
    if verify_serial(current_hwid, serial):
        save_license(current_hwid, serial)
        return True
    
    return False
