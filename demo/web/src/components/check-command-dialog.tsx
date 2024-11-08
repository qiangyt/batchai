import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { CommandDetail, otEvent } from '@/lib';
import { Dispatch, MouseEvent, SetStateAction, useState } from 'react';
import LangSelect from './lang-select';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';

interface CheckCommandDialogProps {
  repo: string;
  data: CommandDetail;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>
}

export default function CheckCommandDialog({ repo, data, open, setOpen }: CheckCommandDialogProps) {
  const [_data, setData] = useState(data);

  const onClose = (e: MouseEvent) => {
    otEvent(e);
    setOpen(false);
  };

  const onChangeLang = (newValue: string) => {
    setData(CommandDetail.with({..._data, lang: newValue}));
  };

  const onSubmit = (e: MouseEvent) => {    
    otEvent(e);
    alert(JSON.stringify(_data, null, 4));
  };

  return (
    <Dialog open={open} fullWidth={true} onClose={onClose} PaperProps={{ component: 'form', onSubmit, }}>
      <DialogTitle>Check the Codebase</DialogTitle>
      <Divider/>
      <DialogContent>
        <DialogContentText>
          <Typography sx={{ fontSize: 12}}>Repository Path:</Typography>
          <Link href={repo}>{repo}</Link>
        </DialogContentText>
        <Box sx={{width: "66%", mt: 3}}><LangSelect value={_data.lang} onChange={onChangeLang}/></Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" onClick={onSubmit}>Submit Your Request</Button>
      </DialogActions>
    </Dialog>
  );
}

