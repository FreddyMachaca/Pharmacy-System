import hashlib
import uuid
import subprocess
import platform

def get_hwid():
    identifiers = []
    
    try:
        mac = ':'.join(['{:02x}'.format((uuid.getnode() >> elements) & 0xff) for elements in range(0,8*6,8)][::-1])
        identifiers.append(mac)
    except:
        identifiers.append('00:00:00:00:00:00')
    
    try:
        system = platform.system()
        if system == 'Windows':
            result = subprocess.check_output('wmic csproduct get uuid', shell=True)
            uuid_str = result.decode().split('\n')[1].strip()
            identifiers.append(uuid_str)
            
            cpu_result = subprocess.check_output('wmic cpu get processorid', shell=True)
            cpu_id = cpu_result.decode().split('\n')[1].strip()
            identifiers.append(cpu_id)
            
            disk_result = subprocess.check_output('wmic diskdrive get serialnumber', shell=True)
            disk_serial = disk_result.decode().split('\n')[1].strip()
            identifiers.append(disk_serial)
    except:
        identifiers.append(platform.node())
        identifiers.append(platform.processor())
    
    combined = '|'.join(identifiers)
    hwid_hash = hashlib.sha256(combined.encode()).hexdigest()[:16].upper()
    
    return hwid_hash

def generate_serial(hwid):
    secret_salt = "FARMACIA_BOLIVIA_2025_SECRET_KEY_FKJ_9429_78436786873"
    combined = f"{hwid}{secret_salt}"
    hash_obj = hashlib.sha256(combined.encode())
    hash_hex = hash_obj.hexdigest()
    
    parts = [
        hash_hex[0:4].upper(),
        hash_hex[4:8].upper(),
        hash_hex[8:12].upper()
    ]
    
    serial = f"FARM-BOL-2025-{parts[0]}-{parts[1]}-{parts[2]}"
    return serial

def verify_serial(hwid, serial):
    expected_serial = generate_serial(hwid)
    return serial.strip().upper() == expected_serial.upper()
