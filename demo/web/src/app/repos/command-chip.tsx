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
}

function CommandDialog({commandName, repo, data, open, setOpen}:{commandName:string, repo: string, data: CommandDetail, open: boolean, setOpen: Dispatch<SetStateAction<boolean>>}) {
  switch (commandName) {
    case 'check': return <CheckCommandDialog repo={repo} data={data} open={open} setOpen={setOpen}/>;
    case 'test': return <TestCommandDialog repo={repo} data={data} open={open} setOpen={setOpen} />;
    default: throw new Error(`${commandName} is not supported`);
  } 
}

export function CommandChip({ repo, commandName }: CommandChipProps) {
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
    case 'check': dlg = <CheckCommandDialog repo={repo.repoUrl} data={data} open={openDialog} setOpen={setOpenDialog}/>; break;
    case 'test': dlg = <TestCommandDialog repo={repo.repoUrl} data={data} open={openDialog} setOpen={setOpenDialog} />; break;
    default: throw new Error(`${commandName} is not supported`);
  } 

  return (
    <>
      {dlg}
      <Chip component="a" sx={{ color: "white" }} label={`batchai ${commandName}`} variant="outlined" onClick={onClickCreate} />
    </>
  )
}