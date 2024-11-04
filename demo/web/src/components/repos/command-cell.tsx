"use client"

import { CommandBasic, CommandCreateReq, CommandStatus } from "@/lib";
import * as React from "react"
import NextLink from 'next/link'
import Link from '@mui/material/Link';
import CommitIcon from '@mui/icons-material/CommitOutlined';
import ErrorIcon from '@mui/icons-material/ErrorOutlined';
import CommandIcon from '@mui/icons-material/KeyboardCommandKeyOutlined';
import QueueIcon from '@mui/icons-material/QueueOutlined';
import PendingIcon from '@mui/icons-material/PendingOutlined';
import RunningIcon from '@mui/icons-material/RotateRightOutlined';
import SucceededIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";


export interface CommandCreateProps {
    repoPath: string;
    command: string;
  }

export function CommandDisplayLink({ command }: { command: CommandBasic }) {
    const commandId = command.id;
    const commandRef = `/commands/${commandId}`

    let commitCell;
    switch (command.status) {
        case CommandStatus.Pending:
            commitCell = (<Link href={commandRef}>
                <PendingIcon /><Typography sx={{ color: 'primary', ml: 1, display: 'inline-block'}}>Pending</Typography>
            </Link>)
        case CommandStatus.Queued:
            commitCell = (<Link href={commandRef}>
                <QueueIcon /><Typography sx={{ color: 'secondary', ml: 1, display: 'inline-block'}}>Queued</Typography>
            </Link>)
        case CommandStatus.Running:
            commitCell = (<Link href={commandRef}>
                <RunningIcon /><Typography sx={{ color: 'info', ml: 1, display: 'inline-block'}}>Running</Typography>
            </Link>)
        case CommandStatus.Succeeded:
            commitCell = (<Link href={command.commitUrl ? command.commitUrl : '#'}>
                <SucceededIcon /><Typography sx={{ color: 'warning', ml: 1, display: 'inline-block'}}>Done <CommitIcon />{command.commitId}</Typography>
            </Link>)
        case CommandStatus.Failed:
            commitCell = (<Link href={commandRef}>
                <ErrorIcon /><Typography sx={{ color: 'error', ml: 1, display: 'inline-block'}}>Failed</Typography>
            </Link>)
    }
    return (
        <Box>
            <Link href={`/commands/${command.id}`}>
                Command...
            </Link>
            <Box>
                {commitCell}
            </Box>
        </Box>
    );
}

export function CommandCreateLink(props: CommandCreateProps) {
    return (
        <NextLink href={{ pathname: '/commands/create', query: { ...props } }} passHref>
            <Chip label={'Create ' + props.command} variant="outlined" />
        </NextLink>
    );
}


export interface CommandCellProps {
    repoPath: string;
    commandText: string;
    command: CommandBasic
}

export function CommandCell({ repoPath, commandText, command }: CommandCellProps) {
    return command ? <CommandDisplayLink command={command} /> : <CommandCreateLink repoPath={repoPath} command={commandText} />;
}