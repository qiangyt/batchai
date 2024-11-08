import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { CommandCreateReq, CommandDetail, otEvent, useSession, useUIContext } from '@/lib';
import { Dispatch, MouseEvent, SetStateAction, useState } from 'react';
import LangSelect from './lang-select';
import TestLibrarySelect from './test-library-select';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import * as commandApi from '@/api/command.api';

interface TestCommandDialogProps {
  repo: string;
  data: CommandDetail;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export default function TestCommandDialog({ repo, data, open, setOpen }: TestCommandDialogProps) {
  const s = useSession().state;
  const ui = useUIContext();
  const [_data, setData] = useState(data);
  
  const onClose = (e: MouseEvent) => {
    otEvent(e);
    setOpen(false);
  };

  const onChangeTestLibrary = (newValue: string) => {
    setData(CommandDetail.with({..._data, testLibrary: [newValue]}));
  };

  const onChangeLang = (newValue: string) => {
    setData(CommandDetail.with({..._data, lang: newValue}));
  };

  const onSubmit = async (e: MouseEvent) => {    
    otEvent(e);

    const params = new CommandCreateReq();
    params.lang = _data.lang;
    params.testLibrary = _data.testLibrary;
    params.repoPath = repo;
    params.command = 'test';

    alert(JSON.stringify(params, null, 4));
    await commandApi.createCommand(s, ui, params);
  };

  return (
    <Dialog open={open} fullWidth={true} onClose={onClose} PaperProps={{ component: 'form', onSubmit, }}>
      <DialogTitle>Generates Unit Tests</DialogTitle>
      <Divider/>
      <DialogContent>
        <DialogContentText>
          <Typography sx={{ fontSize: 12}}>Repository Path:</Typography>
          <Link href={repo}>{repo}</Link>
        </DialogContentText> 
        <Box sx={{width: "66%", mt: 3}}><LangSelect value={_data.lang} onChange={onChangeLang}/></Box>
        <Box sx={{width: "66%", mt: 3}}><TestLibrarySelect value={_data.primaryTestLibrary()} onChange={onChangeTestLibrary}/></Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" onClick={onSubmit}>Submit Your Request</Button>
      </DialogActions>
    </Dialog>
  );
}

