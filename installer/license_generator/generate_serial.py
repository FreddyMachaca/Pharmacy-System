import hashlib
import sys

SECRET_SALT = "FARMACIA_BOLIVIA_2025_SECRET_KEY_FKJ_9429_78436786873"

def generate_serial(hwid):
    combined = f"{hwid}{SECRET_SALT}"
    hash_obj = hashlib.sha256(combined.encode())
    hash_hex = hash_obj.hexdigest()
    
    parts = [
        hash_hex[0:4].upper(),
        hash_hex[4:8].upper(),
        hash_hex[8:12].upper()
    ]
    
    serial = f"FARM-BOL-2025-{parts[0]}-{parts[1]}-{parts[2]}"
    return serial

def main():
    print("=" * 60)
    print("GENERADOR DE SERIALES - SISTEMA FARMACIA PORTABLE")
    print("=" * 60)
    print()
    
    if len(sys.argv) > 1:
        hwid = sys.argv[1].strip()
    else:
        hwid = input("Ingresa el HWID del cliente: ").strip()
    
    if not hwid:
        print("\nError: HWID vacío")
        return
    
    serial = generate_serial(hwid)
    
    print()
    print("=" * 60)
    print(f"HWID:   {hwid}")
    print(f"SERIAL: {serial}")
    print("=" * 60)
    print()
    print("Envía este serial al cliente para activar su licencia.")
    print()

if __name__ == '__main__':
    main()
