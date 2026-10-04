const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',{
 getCPU:()=>ipcRenderer.invoke('metrics:get'),
 getLifecycle:()=>ipcRenderer.invoke('lifecycle:get'),
 setLifecycle:value=>ipcRenderer.invoke('lifecycle:set',value)
});
