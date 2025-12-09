[Setup]
AppName=Sistema de Farmacia Portable
AppVersion=1.0
DefaultDirName={autopf}\FarmaciaSystem
DefaultGroupName=Sistema Farmacia
OutputDir=Output
OutputBaseFilename=Instalador_SistemaFarmacia
Compression=lzma2/max
SolidCompression=yes
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
WizardStyle=modern
;SetupIconFile=resources\icon.ico
UninstallDisplayIcon={app}\FarmaciaLauncher.exe

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "Crear acceso directo en Escritorio"; GroupDescription: "Accesos directos:"

[Files]
Source: "launcher\dist\FarmaciaLauncher.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "portable\node\*"; DestDir: "{app}\node"; Flags: ignoreversion recursesubdirs
Source: "portable\mariadb\*"; DestDir: "{app}\mariadb"; Flags: ignoreversion recursesubdirs
Source: "..\backend\*"; DestDir: "{app}\backend"; Flags: ignoreversion recursesubdirs
Source: "..\frontend\*"; DestDir: "{app}\frontend"; Flags: ignoreversion recursesubdirs
Source: "..\db\pharmacy.sql"; DestDir: "{app}\database"; Flags: ignoreversion

[Icons]
Name: "{group}\Sistema de Farmacia"; Filename: "{app}\FarmaciaLauncher.exe"
Name: "{autodesktop}\Sistema de Farmacia"; Filename: "{app}\FarmaciaLauncher.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\mariadb\bin\mysql.exe"; Parameters: "-u root < {app}\database\pharmacy.sql"; Flags: runhidden waituntilterminated

[Code]
procedure InitializeWizard;
begin
  WizardForm.Caption := 'Instalador - Sistema de Farmacia Portable';
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  
  if CurPageID = wpSelectDir then
  begin
    if (Copy(ExpandConstant('{app}'), 1, 3) <> 'C:\') and 
       (Copy(ExpandConstant('{app}'), 1, 3) <> 'D:\') then
    begin
      MsgBox('Por favor selecciona una ubicación en C:\ o D:\', mbError, MB_OK);
      Result := False;
    end;
  end;
end;
