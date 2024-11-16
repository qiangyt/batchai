'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import ReactAnsi from 'react-ansi';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import { CommandDetail, CommandEditData, CommandLog, CommandRunStatus, CommandStatus, CommandStatusUpdate, SessionState, useSession } from "@/lib";
import * as commandApi from '@/api/command.api';
import { UIContextType, useUIContext } from '@/lib/ui.context';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
//import RefreshIcon from '@mui/icons-material/RefreshOutlined';
import Link from '@mui/material/Link';
import Toolbar from '@mui/material/Toolbar';
//import StopIcon from '@mui/icons-material/StopOutlined';
//import ResumeIcon from '@mui/icons-material/NavigateNextOutlined';
import DownloadIcon from '@mui/icons-material/FileDownloadOutlined';
import ToolbarIcon from '@/components/toolbar.button';
import RestartIcon from '@mui/icons-material/UndoOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';
import CommandDialog from '@/components/command-dialog';
import { socket } from '@/socket';

interface Step {
  status: CommandRunStatus;
  label: string;
  needChanges: boolean;
}

const steps: Step[] = [
  {
    status: CommandRunStatus.Begin,
    label: "Begin",
    needChanges: false
  }, {
    status: CommandRunStatus.CheckedOut,
    label: "`git checkout -b batchai/...`",
    needChanges: false
  }, {
    status: CommandRunStatus.BatchAIExecuted,
    label: "Execute batchai",
    needChanges: false
  }, {
    status: CommandRunStatus.ChangesAdded,
    label: "`git add .`",
    needChanges: false
  }, {
    status: CommandRunStatus.ChangesCommited,
    label: "`git commit -m ...`",
    needChanges: false
  }, {
    status: CommandRunStatus.ChangesPushed,
    label: "`git push`",
    needChanges: true
  }, {
    status: CommandRunStatus.ChangesArchived,
    label: "Archives the artifact",
    needChanges: true
  }, {
    status: CommandRunStatus.GetCommitId,
    label: "Get commit id",
    needChanges: true
  }, {
    status: CommandRunStatus.End,
    label: "End",
    needChanges: false
  },
];

function refreshActiveStep(runStatus: CommandRunStatus, setActiveStep: React.Dispatch<React.SetStateAction<number>>) {
  setActiveStep(steps.findIndex(x => x.status === runStatus));
}

async function refreshPage(s: SessionState, ui: UIContextType, id: number,
  setCommand: React.Dispatch<React.SetStateAction<CommandDetail>>,
  setActiveStep: React.Dispatch<React.SetStateAction<number>>): Promise<void> {

  ui.setLoading(true);
  try {
    const c = await commandApi.loadCommand(s, ui, id);

    refreshActiveStep(c.runStatus, setActiveStep);
    setCommand(c);
  } catch (err) {
    ui.setError(err);
  } finally {
    ui.setLoading(false);
  };
}

export default function CommandHome({ params }) {
  const router = useRouter();
  const [command, setCommand] = useState<CommandDetail>(null);
  const [openCommandDialog, setOpenCommandDialog] = useState(false);
  const [status, setStatus] = useState(command?.status);
  const [logs, setLogs] = useState<CommandLog[]>([]);
  const repo = command?.repo;
  const owner = repo?.owner;
  const id = params.id;
  const s = useSession().state;
  const [activeStep, setActiveStep] = useState(0);
  const ui = useUIContext();

  const [showProgress, setShowProgress] = React.useState(false);
  const toggleProgress = (show: boolean) => () => {
    setShowProgress(show);
  };

  const handleCopy = () => {
    navigator?.clipboard?.writeText(command?.commandLine()).then(
      () => {
        alert('Copied to clipboard!');//TODO
      },
      (err) => {
        console.error('Failed to copy: ', err);
      }
    );
  };

  useEffect(() => {
    refreshPage(s, ui, id, setCommand, setActiveStep);
  }, [s, ui, id]);
  
  useEffect(() => {
    function onStatusEvent(c: CommandStatusUpdate) {
      setStatus(c.status);
      refreshActiveStep(c.runStatus, setActiveStep);
    }

    function onLogEvent(newLog: CommandLog) {
      setLogs([...logs, newLog]);
    }
    
    socket.on("status", onStatusEvent);
    socket.emit("status", id);

    socket.on("log", onLogEvent);
    socket.emit("log", { id, amount: logs.length }, (newLogs: CommandLog[]) => {
      setLogs([...logs, ...newLogs]);
    });

    return () => {
      socket.off("log");
      socket.off("status");
    };
  }, [id, logs]);

  const onRestart = async () => {
    const c = await commandApi.restartCommand(s, ui, id);

    refreshActiveStep(c.runStatus, setActiveStep);
    setCommand(c);
  };

  const onDelete = async () => {
    ui.confirm(
      {
        action: 'delete', 
        subject: `${owner.name}/${repo.name} ${command.command}`, 
        subjectType: 'command'
      }, 
      async() => {
        await commandApi.removeCommand(s, ui, id);
        router.push('/repos');
      }
    );
  };

  const onClickEditIcon = () => {
    setOpenCommandDialog(true);
  };

  const onCommandUpdated = (newCommand: CommandDetail) => {
    setCommand(newCommand);
  };

  const enableRestart = (status !== CommandStatus.Running);
  const enableDelete = (status !== CommandStatus.Running);
  const enableEdit = (status !== CommandStatus.Running);
  const enableDownload = (status === CommandStatus.Succeeded);
  
  const title = command?.isTest() ? 'Generates Unit Tests' : 'Scans General Issues';
  
  return (
    <>
      <Box sx={{ mt: 6, mb: 2, color: 'white' }}>
        <Typography variant="body2" color="lightgray">{title}</Typography>
        <Box sx={{mt: 2, fontFamily: 'arial', }}>
          <span style={{ color: "gray", fontSize: 12, marginRight: 8}}>for</span>
          <Typography variant="h5" component="a" href={repo?.repoUrl}>{owner?.name} / {repo?.name}</Typography>
          <Link sx={{ ml: 2 }} color='info' href={command?.repo.repoUrl}>( {command?.repo.repoUrl} )</Link>
          
          <Typography sx={{mt: 2}} variant="body2">
            {status} 
            <Link href={`/rest/v1/repos/id/${repo?.id}/artifact`} download target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: enableDownload ? '#4A90E2' : 'gray' }}>
              <DownloadIcon sx={{ ml: 2, color: enableDownload ? '#4A90E2' : 'gray' }} />
            </Link>
          </Typography>
          <Button color='info' onClick={toggleProgress(true)}>Detailed progress</Button>

          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row' }}>
            {command?.hasChanges ?
              <>
                <Typography variant="body2">Changes:</Typography>
                <Link sx={{ ml: 2 }} href={command?.commitId ? command.commitUrl : '#'}>{command?.commitId ? command.commitUrl : 'N/A'}</Link>
              </>
              :
              <Typography variant="body2">No changes</Typography>
            }
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Toolbar sx={{ mb: 2 }}>
        <ToolbarIcon key='(Re)Start' label='(Re)start' enabled={enableRestart} onClick={onRestart}>
          <RestartIcon sx={{ color: enableRestart ? '#B8E986' : 'gray' }} />
        </ToolbarIcon>
        <ToolbarIcon key='Edit' label='Edit' enabled={enableEdit} onClick={onClickEditIcon}>
          <EditIcon sx={{ color: enableEdit ? '#B8E986' : 'gray' }} />
        </ToolbarIcon>
        <ToolbarIcon key='Delete' label='Delete' enabled={enableDelete} onClick={onDelete}>
          <DeleteIcon sx={{ color: enableDelete ? 'red' : 'gray' }} />
        </ToolbarIcon>        
      </Toolbar>

      <Box sx={{ mb: 2 }}>
        <Typography sx={{ mt: 2 }} variant="body2">Command Line & Execution Log</Typography>
        <div
          style={{
            paddingTop: '5px', paddingBottom: '5px', paddingLeft: '12px', paddingRight: '12px',
            width: '100%', background: '#404040', color: 'white', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ paddingLeft: 50 }}>
            $ <span style={{ color: '#80ff80' }}>batchai</span>
            &nbsp;&nbsp;{command?.globalOptions().join(' ')}
            <span style={{ color: '#80ff80' }}>&nbsp;&nbsp;{command?.command}</span>
            &nbsp;&nbsp;{command?.commandOptions().join(' ')}
            &nbsp;&nbsp;.
            &nbsp;&nbsp;{command?.targetPaths.join(' ')}
          </div>
          <IconButton onClick={handleCopy} color="primary" aria-label="copy command">
            <ContentCopyIcon />
          </IconButton>
        </div>
        <ReactAnsi log={logs.map(log => `${log.timestamp}    ${log.message}`)} logStyle={{ fontSize: 12, backgroundColor: 'black' }} />
      </Box>

      <Drawer anchor='right' open={showProgress} onClose={toggleProgress(false)}>
        <Stepper sx={{ margin: 4 }} activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => {
            return (
              <Step key={step.status} completed={index <= activeStep && (!step.needChanges || (step.needChanges && command?.hasChanges))}>
                <StepLabel error={index === (activeStep + 1) && status == CommandStatus.Failed}>{step.label}</StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Drawer>
        
      {command && <CommandDialog data={CommandEditData.forUpdate(command)} open={openCommandDialog} setOpen={setOpenCommandDialog} onSubmited={onCommandUpdated} />}
    </>
  );
}

