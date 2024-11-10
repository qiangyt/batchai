import { RepoBasic } from "@/lib/repo.dto";
import NextLink from 'next/link'
import Chip from '@mui/material/Chip';
import { useState, MouseEvent } from "react";
import { CommandDetail, otEvent, CommandEditData } from "@/lib";
import CommandDialog from "@/components/command-dialog";

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
        <Chip sx={{ color: "#50E3C2", borderColor: "#50E3C2" }} label={`batchai ${commandName}`} variant="outlined" />
      </NextLink>
    )
  }
  
  const onClickCreate = (e: MouseEvent) => {
    otEvent(e);
    setOpenDialog(true);    
  };

  const data = CommandEditData.forCreate(commandName, repo);

  return (
    <>
      <CommandDialog data={data} open={openDialog} setOpen={setOpenDialog} onSubmited={onCommandCreated} />
      <Chip component="a" sx={{ color: "white", borderColor: "gray" }} label={`batchai ${commandName}`} variant="outlined" onClick={onClickCreate} />
    </>
  )
}