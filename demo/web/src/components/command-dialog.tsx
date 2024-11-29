"use client";

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { CommandCreateReq, CommandDetail, CommandEditData, CommandUpdateReq, GrantLevel, otEvent, useSession, useUIContext } from '@/lib';
import { ChangeEvent, Dispatch, MouseEvent, SetStateAction, useEffect, useState } from 'react';
import LangSelect from './lang-select';
import TestLibrarySelect from './test-library-select';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import * as commandApi from '@/api/command.api';
import TextField from '@mui/material/TextField';
import Draggable from 'react-draggable';
import Paper, { PaperProps } from '@mui/material/Paper';
import TargetPathInput from './target-path-input';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

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

export default function CommandDialog({ data: _data, open, setOpen, onSubmited }: CommandDialogProps) {
  const s = useSession().state;
  const ui = useUIContext();
  const [data, setData] = useState(_data);
  const title = data.isTest() ? 'Generates Unit Tests' : 'Scans General Issues';

  const onTargetPathsChange = (targetPaths: string[]) => {
    setData(CommandEditData.with({ ...data, targetPaths }));
  };

  const onClose = (e: MouseEvent) => {
    otEvent(e);
    setOpen(false);
  };

  const onChangeTestLibrary = (testLibrary: string) => {
    setData(CommandEditData.with({ ...data, testLibrary }));
  };

  const onChangeLang = (lang: string) => {
    setData(CommandEditData.with({ ...data, lang }));
  };

  const onChangeCheckFix = (e: ChangeEvent<HTMLInputElement>, checkFix: boolean) => {
    setData(CommandEditData.with({ ...data, checkFix }));
  }

  const onChangeExecuteItRightNow = (e: ChangeEvent<HTMLInputElement>, executeItRightNow: boolean) => {
    otEvent(e);
    setData(CommandEditData.with({ ...data, executeItRightNow }));
  };

  const onChangeNum = (e: ChangeEvent<HTMLInputElement>) => {
    otEvent(e);

    const num = parseInt(e.target.value, 10);
    if (isNaN(num)) {
      return;
    }
    if (num < 0) {
      return;
    }

    if (data.numQuota > 0) {
      if (num <= 0 || num > data.numQuota) {
        ui.requestStar();
        return;
      }
    }

    setData(CommandEditData.with({ ...data, num }));
  };

  const onSubmit = async (e: MouseEvent) => {
    otEvent(e);

    let cmd: CommandDetail;
    if (data.isUpdate()) {
      cmd = await commandApi.updateCommand(s, ui, data.id, CommandUpdateReq.create(data));
    } else {
      cmd = await commandApi.createCommand(s, ui, CommandCreateReq.create(data));
    }
    onSubmited(cmd);
    setOpen(false);
  };

  return (<>
    <Dialog open={open} onClose={onClose} PaperComponent={PaperComponent} aria-labelledby="draggable-dialog-title">
      <DialogTitle sx={{ backgroundColor: '#21232b', color: 'white', cursor: 'move' }} id="draggable-dialog-title">
        <span style={{ fontSize: 15 }}>{title}</span>
        <p /><span style={{ fontSize: 12, marginRight: 8 }}>for</span>
        <Link href={data.repo.repoUrl} sx={{ color: 'white', fontSize: 24 }}>{data.repo.repoUrl}</Link></DialogTitle>
      <DialogContent>
        <Box sx={{ width: "64%", mt: 5 }}><LangSelect value={data.lang} onChange={onChangeLang} /></Box>
        <TextField size='small' sx={{ width: "64%", mt: 3 }} label="Number of file to process" type="number" placeholder="Type a number…" value={data.num} onChange={onChangeNum}
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }} />
        {data.isTest() && <Box sx={{ width: "64%", mt: 3 }}><TestLibrarySelect value={data.testLibrary} onChange={onChangeTestLibrary} /></Box>}
        {data.isCheck() && <Box sx={{ width: "64%", mt: 3 }}><FormControlLabel sx={{ mt: 1 }} control={<Checkbox size='small' checked={data.checkFix} onChange={onChangeCheckFix} />} label="Fix detected issues" /></Box>}

        <FormControlLabel sx={{ mt: 1 }} control={<Checkbox size='small' checked={data.executeItRightNow} onChange={onChangeExecuteItRightNow} />} label="Executes it right now" />

        <TargetPathInput commandId={data.id} repoId={data.repo.id} targetPaths={data.targetPaths} onChange={onTargetPathsChange} />

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" onClick={onSubmit}>Submit</Button>
      </DialogActions>
    </Dialog>
  </>
  );
}

