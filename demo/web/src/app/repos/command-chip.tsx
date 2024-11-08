import { RepoBasic } from "@/lib/repo.dto";
import NextLink from 'next/link'
import Chip from '@mui/material/Chip';
import { useState, MouseEvent, SetStateAction, Dispatch } from "react";
import { CommandDetail, otEvent, useUIContext, useSession } from "@/lib";
import TestCommandDialog from "@/components/test-command-dialog";
import CheckCommandDialog from "@/components/check-command-dialog";

interface CommandChipProps {
  repo: RepoBasic;
  commandName: string;  
  onCommandCreated: (command: CommandDetail) => void;
}

export function CommandChip({ repo, commandName, onCommandCreated }: CommandChipProps) {
  const [openDialog, setOpenDialog] = useState(false);

  const cmd = repo.command(commandName);
  if (cmd) {
    const id = cmd.id;
    return (
      <NextLink href={{ pathname: `/commands/${id}`, query: { id } }} passHref>
        <Chip sx={{ color: "white" }} label={`batchai ${commandName}`} variant="outlined" />
      </NextLink>
    )
  }
  
  const onClickCreate = (e: MouseEvent) => {
    otEvent(e);
    setOpenDialog(true);    
  };

  const data = CommandDetail.init(repo);
  let dlg;
  switch (commandName) {
    case 'check': dlg = <CheckCommandDialog repo={repo.repoUrl} data={data} open={openDialog} setOpen={setOpenDialog} onSubmited={onCommandCreated}/>; break;
    case 'test': dlg = <TestCommandDialog repo={repo.repoUrl} data={data} open={openDialog} setOpen={setOpenDialog} onSubmited={onCommandCreated} />; break;
    default: throw new Error(`${commandName} is not supported`);
  } 

  return (
    <>
      {dlg}
      <Chip component="a" sx={{ color: "white" }} label={`batchai ${commandName}`} variant="outlined" onClick={onClickCreate} />
    </>
  )
}