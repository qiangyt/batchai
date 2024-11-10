"use client";

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { CommandCreateReq, CommandDetail, CommandEditData, CommandUpdateReq, otEvent, useSession, useUIContext } from '@/lib';
import { Dispatch, MouseEvent, SetStateAction, useState } from 'react';
import LangSelect from './lang-select';
import TestLibrarySelect from './test-library-select';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import * as commandApi from '@/api/command.api';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Draggable from 'react-draggable';
import Paper, { PaperProps } from '@mui/material/Paper';
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded';

function PaperComponent(props: PaperProps) {
  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} />
    </Draggable>
  );
}



interface CommandDialogProps {
  data: CommandEditData;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onSubmited: (command: CommandDetail) => void;
}

export default function CommandDialog({ data:_data, open, setOpen, onSubmited }: CommandDialogProps) {
  const s = useSession().state;
  const ui = useUIContext();
  const [data, setData] = useState(_data);
  const [targetPath, setTargetPath] = useState('');
  const title = data.isTest() ? 'Generates Unit Tests' : 'Scans General Issues';
  
  const onKeyTargetPath = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTargetPath();
    }
  };

  const handleTargetPathChange = (event) => {
    otEvent(event);
    setTargetPath(event.target.value);
  };

  const handleAddTargetPath = () => {
    if (targetPath.trim()) {
      setData(CommandEditData.with({...data, targetPaths: [targetPath, ...data.targetPaths]}));
      setTargetPath(''); // 清空输入框
    }
  };

  const handleDeleteTargetPath = (index) => {
    setData(CommandEditData.with({...data, targetPaths: data.targetPaths.filter((_, i) => i !== index)}));
  };

  const onClose = (e: MouseEvent) => {
    otEvent(e);
    setOpen(false);
  };

  const onChangeTestLibrary = (newTestLibrary: string) => {
    setData(CommandEditData.with({...data, testLibrary: newTestLibrary}));
  };

  const onChangeLang = (newLang: string) => {
    setData(CommandEditData.with({...data, lang: newLang}));
  };

  const onChangeNum = (e: React.ChangeEvent<HTMLInputElement>) => {
    otEvent(e);
    const newNum = parseInt(e.target.value, 10);
    if (isNaN(newNum)) {
      return;
    }
    if (newNum < 0) {
      return;
    }
    setData(CommandEditData.with({...data, num: newNum}));
  };

  const onSubmit = async (e: MouseEvent) => {    
    otEvent(e);

    let cmd:CommandDetail;
    if (data.isUpdate()) {
      cmd = await commandApi.updateCommand(s, ui, data.id, CommandUpdateReq.create(data));
    } else {
      cmd = await commandApi.createCommand(s, ui, CommandCreateReq.create(data));
    }
    onSubmited(cmd);    
    setOpen(false);
  };

  return (
    <Dialog open={open} fullWidth={true} onClose={onClose} PaperComponent={PaperComponent} aria-labelledby="draggable-dialog-title">
      <DialogTitle sx={{ backgroundColor: '#808080', color: 'white', cursor: 'move' }} id="draggable-dialog-title">
      <span style={{ fontSize: 15}}>{title}</span>
        <p/><span style={{ fontSize: 12, marginRight: 8}}>for</span>
      <Link href={data.repo.repoUrl} sx={{ color: 'white', fontSize: 24 }}>{data.repo.repoUrl}</Link></DialogTitle>
      <DialogContent>          
        <Box sx={{width: "66%", mt: 5}}><LangSelect value={data.lang} onChange={onChangeLang} /></Box>
        <TextField size='small' sx={{width: "66%", mt: 3}} label="Number of file to process" type="number" placeholder="Type a number…" value={data.num} onChange={onChangeNum} 
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }} />
        {data.isTest() && <Box sx={{width: "66%", mt: 3}}><TestLibrarySelect value={data.testLibrary} onChange={onChangeTestLibrary}/></Box>}
          
        <Box sx={{mt: 3, border: 0.5, borderColor: 'lightgray', borderRadius: 1, padding: 1}}>
          <TextField label="Target Path" variant="outlined" size='small' placeholder='relative folder/file path' fullWidth value={targetPath} onChange={handleTargetPathChange} onKeyDown={onKeyTargetPath}/>
          <Button variant="contained" color="inherit" onClick={handleAddTargetPath} sx={{ mt: 1, mb: 1 }}>
            Add Target Path
          </Button>

          { data.targetPaths && data.targetPaths.length > 0 &&
            <List style={{maxHeight: 200, overflowY: 'auto', border: '0.5px solid #ddd'}}>
              {data.targetPaths.map((item, index) => (
                <ListItem key={index} divider sx={{maxHeight: 28}} secondaryAction={
                  <IconButton edge="end" onClick={() => handleDeleteTargetPath(index)}>
                    <DeleteIcon />
                  </IconButton>
                }>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          }
        </Box>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" onClick={onSubmit}>Submit</Button>
      </DialogActions>
    </Dialog>
  );
}

