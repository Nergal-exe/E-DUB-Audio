!macro customUnInstall
  ; Upgrades preserve profiles; a real uninstall removes this user's app data.
  ${IfNot} ${isUpdated}
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "E-DUB Audio"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "e-dub-audio"
    SetShellVarContext current
    RMDir /r "$LOCALAPPDATA\E-DUB Audio"
    RMDir /r "$LOCALAPPDATA\e-dub-audio"
    SetShellVarContext all
  ${EndIf}
!macroend
