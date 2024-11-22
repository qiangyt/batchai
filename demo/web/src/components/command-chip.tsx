import { RepoBasic } from "@/lib/repo.dto";
import NextLink from 'next/link'
import Chip from '@mui/material/Chip';
import { useState, MouseEvent } from "react";
import { CommandDetail, otEvent, CommandEditData, useSession, useUIContext } from "@/lib";
import CommandDialog from "@/components/command-dialog";

interface CommandChipProps {
  repo: RepoBasic;
  commandName: string;  
  onCommandCreated: (command: CommandDetail) => void;
}

export function CommandChip({ repo, commandName, onCommandCreated }: CommandChipProps) {
  const s = useSession().state;
  const ui = useUIContext();
  const [openDialog, setOpenDialog] = useState(false);

  const cmd = repo.command(commandName);
  if (cmd) {
    const id = cmd.id;
    return (
      <NextLink href={{ pathname: `/commands/${id}`, query: { id } }} passHref>
        <Chip sx={{ color: "#4A90E2", borderColor: "#4A90E2" }} label={`batchai ${commandName}`} variant="outlined" />
      </NextLink>
    )
  }
  
  const onClickCreate = (e: MouseEvent) => {
    otEvent(e);
    if (!s.detail || !s.detail.accessToken) {
      ui.signIn({action: "create command"});
      return;
    }
    setOpenDialog(true);    
  };

  const data = CommandEditData.forCreate(s, commandName, repo);

  return (
    <>
      <CommandDialog data={data} open={openDialog} setOpen={setOpenDialog} onSubmited={onCommandCreated} />
      <Chip component="a" sx={{ color: "white", borderColor: "gray" }} label={`batchai ${commandName}`} variant="outlined" onClick={onClickCreate} />
    </>
  )
}