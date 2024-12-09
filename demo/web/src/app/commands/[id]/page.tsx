'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import { CommandDetail, CommandEditData, CommandLog, CommandRunStatus, CommandStatus, UserBasic, useSession } from "@/lib";
import * as commandApi from '@/api/command.api';
import { useUIContext } from '@/lib/ui.context';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import LockIcon from '@mui/icons-material/LockOutlined';
import UnlockIcon from '@mui/icons-material/NoEncryptionOutlined';
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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { AuditLogViewer, ExecutionLogViewer } from './log-viewer';
import { FileDiff } from '@/lib/diff';
import LinearProgress from '@mui/material/LinearProgress';
import { useTranslation } from '@/lib/i18n';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Box width="104%"
      sx={{ ml: -3 }}
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </Box>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}


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
    status: CommandRunStatus.SyncRepo,
    label: "Sync with remote repository",
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
    label: "Archives the changes",
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

export default function CommandHome({ params }) {
  const router = useRouter();
  const [command, setCommand] = useState<CommandDetail>(null);
  const [openCommandDialog, setOpenCommandDialog] = useState(false);
  const [auditLogs, setAuditLogs] = useState<CommandLog[]>([]);
  const [executionLogs, setExecutionLogs] = useState<CommandLog[]>([]);
  const [diffs, setDiffs] = useState<FileDiff[]>([]);
  const { t } = useTranslation();

  let enableRestart = false;
  let enableDelete = false;
  let enableEdit = false;
  let enableDownload = false;
  let title = '';
  let status = CommandStatus.Pending;
  let hasChanges = false;
  let commitUrl = '';
  let globalOptions: string[] = [];
  let commandOptions: string[] = [];
  let targetPaths: string[] = [];
  let commandName = '';
  let repoUrl = '';
  let repoName = '';
  let ownerName = '';

  if (command) {
    enableRestart = (command.status !== CommandStatus.Running);
    enableDelete = (command.status !== CommandStatus.Running);
    enableEdit = (command.status !== CommandStatus.Running);
    enableDownload = (command.status === CommandStatus.Succeeded);
    title = command.isTest() ? t('Generates Unit Tests') : t('Scans General Issues');
    status = command.status;
    hasChanges = command.hasChanges;
    commitUrl = command.commitId ? command.commitUrl : '';
    globalOptions = command.globalOptions();
    commandOptions = command.commandOptions();
    targetPaths = command.targetPaths;
    commandName = command.command;

    const repo = command.repo;
    repoUrl = repo.repoUrl;
    repoName = repo.name;
    ownerName = repo.owner.name;
  }

  const id = params.id;
  const s = useSession().state;
  const [activeStep, setActiveStep] = useState(0);
  const ui = useUIContext();

  const [logTabIndex, setLogTabIndex] = React.useState(0);
  const onChangeLogTab = (event: React.SyntheticEvent, newTabIndex: number) => {
    setLogTabIndex(newTabIndex);
  };

  const [showProgress, setShowProgress] = React.useState(false);
  const toggleProgress = (show: boolean) => () => {
    setShowProgress(show);
  };

  const handleCopy = () => {
    if (!navigator.clipboard) {
      alert(t('Cannot access clipboard'));
      return;
    }

    navigator.clipboard?.writeText(command?.commandLine()).then(
      () => {
        console.log('Copied to clipboard!');
      },
      (err) => {
        console.error('Failed to copy: ', err);
      }
    );
  };

  function onRefreshPage(c: CommandDetail) {
    setExecutionLogs([]);
    setAuditLogs([]);
    refreshActiveStep(c.runStatus, setActiveStep);
    setCommand(c);

    let newLogTabIndex: number;
    if (c.hasChanges) {
      newLogTabIndex = 0;
    } else {
      newLogTabIndex = (c.status === CommandStatus.Succeeded) ? 1 : 2;
    }
    setLogTabIndex(newLogTabIndex);
  };

  useEffect(() => {
    async function refreshPage(id) {
      ui.setLoading(true);
      try {
        const c = await commandApi.loadCommand(s, ui, id);
        onRefreshPage(c);

        if (c.isTest()) {
          const reports = await commandApi.loadCommandTestReports(s, ui, id);
          setDiffs(reports.map((report) => report.toDiff()));
        }
        if (c.isCheck()) {
          const reports = await commandApi.loadCommandCheckReports(s, ui, id);
          setDiffs(reports.map((report) => report.toDiff()));
        }
      } catch (err) {
        ui.setError(err);
      } finally {
        ui.setLoading(false);
      };
    }
    refreshPage(id);
  }, [s, ui, id]);

  useEffect(() => {
    async function onStatusEvent(c: CommandDetail) {
      CommandDetail.with(c);

      refreshActiveStep(c.runStatus, setActiveStep);
      setCommand(c);

      if (c.status === CommandStatus.Succeeded) {
        if (c.isTest()) {
          const reports = await commandApi.loadCommandTestReports(s, ui, id);
          setDiffs(reports.map((report) => report.toDiff()));
        }
        if (c.isCheck()) {
          const reports = await commandApi.loadCommandCheckReports(s, ui, id);
          setDiffs(reports.map((report) => report.toDiff()));
        }

        setLogTabIndex(0);
      }
    }

    function onAuditLogEvent(newLog: CommandLog) {
      setAuditLogs(prevAuditLogs => [...prevAuditLogs, newLog]);
    }

    function onExecutionLogEvent(newLog: CommandLog) {
      setExecutionLogs(prevExecutionLogs => [...prevExecutionLogs, newLog]);
    }

    //if (!socket.connected) {
    //  alert('connecting...');
    socket.connect();
    //} else {
    //  alert('already connected');
    //}

    socket.on(`status-${id}`, onStatusEvent);
    socket.emit("subscribeStatusEvent", id);

    socket.on(`auditLog-${id}`, onAuditLogEvent);
    socket.on(`executionLog-${id}`, onExecutionLogEvent);

    socket.emit("subscribeLogEvent", id,
      (newLogs: CommandLog[][]) => {
        setAuditLogs(prevAuditLogs => [...prevAuditLogs, ...newLogs[0]]);
        setExecutionLogs(prevExecutionLogs => [...prevExecutionLogs, ...newLogs[1]]);
      }
    );

    return () => {
      socket.off(`status-${id}`);
      socket.off(`auditLog-${id}`);
      socket.off(`executionLog-${id}`);
    };
  }, [id]);

  const onRestart = async () => {
    if (!s.detail || !s.detail.accessToken) {
      ui.signIn({ action: t('restart command') });
      return;
    }

    const c = await commandApi.restartCommand(s, ui, id);
    onRefreshPage(c);

    setLogTabIndex(2);
  };

  const onDelete = async () => {
    if (!s.detail || !s.detail.accessToken) {
      ui.signIn({ action: t('delete command') });
      return;
    }    

    if (!s.detail.user.admin) {
      ui.setError(t('admin privilege is required'));
      return;
    }

    if (command.locked) {
      ui.setError(t('this command is locked'));
      return;
    }

    ui.confirm(
      {
        action: t('delete'),
        subject: `${ownerName}/${repoName} ${commandName}`,
        subjectType: t('command'),
      },
      async () => {
        await commandApi.removeCommand(s, ui, id);
        router.push('/repos');
      }
    );
  };

  const onLockOrUnlock = async () => {
    if (!s.detail || !s.detail.accessToken) {
      ui.signIn({ action: t('lock/unlock command') });
      return;
    }

    if (!s.detail.user.admin) {
      ui.setError(t('admin privilege is required'));
      return;
    }

    let c: CommandDetail;
    if (command.locked) {
      c = await commandApi.unlockCommand(s, ui, id);
    } else {
      c = await commandApi.lockCommand(s, ui, id);
    }

    onRefreshPage(c);
  };

  const onClickEditIcon = () => {
    if (!s.detail || !s.detail.accessToken) {
      if (id) {
        ui.signIn({ action: t('update command') });
      } else {
        ui.signIn({ action: t('create command') });
      }
      return;
    }
    if (command.locked) {
      ui.setError(t('this command is locked'));
      return;
    }
    setOpenCommandDialog(true);
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" sx={{ mt: 3, mb: 4, color: 'white' }}>
        <Box>
          <Typography variant="body2" color="lightgray">{title}</Typography>
          <Box sx={{ mt: 2, fontFamily: 'arial' }}>
            <span style={{ color: "gray", fontSize: 12, marginRight: 8 }}>for</span>
            <Typography variant="h5" component="a" href={repoUrl}>{ownerName} / {repoName}</Typography>
            <Link sx={{ ml: 2 }} color='info' href={repoUrl}>( {repoUrl} )</Link>

            <Typography sx={{ mt: 2 }} variant="body2">
              {status}
              <Link href={`/rest/v1/commands/id/${id}/artifact`} download target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: enableDownload ? '#4A90E2' : 'gray' }}>
                <DownloadIcon sx={{ ml: 2, color: enableDownload ? '#4A90E2' : 'gray' }} />
              </Link>
            </Typography>
            <Button color='info' onClick={toggleProgress(true)}>{t("Detailed progress")}</Button>
          </Box>
        </Box>

        <Box>
          <Toolbar>
            <ToolbarIcon key='(Re)Start' label={t('(Re)start')} enabled={enableRestart} onClick={onRestart}>
              <RestartIcon sx={{ color: enableRestart ? '#B8E986' : 'gray' }} />
            </ToolbarIcon>
            <ToolbarIcon key='Edit' label={t('Edit')} enabled={enableEdit} onClick={onClickEditIcon}>
              <EditIcon sx={{ color: enableEdit ? '#B8E986' : 'gray' }} />
            </ToolbarIcon>
            <ToolbarIcon key='LockOrUnlock' label={command?.locked ? t('Unlock') : t('Lock')} enabled onClick={onLockOrUnlock}>
              {command?.locked ?
                <UnlockIcon sx={{ color: '#B8E986' }} />
                :
                <LockIcon sx={{ color: '#B8E986' }} />
              }
            </ToolbarIcon>
            <ToolbarIcon key='Delete' label={t('Delete')} enabled={enableDelete} onClick={onDelete}>
              <DeleteIcon sx={{ color: enableDelete ? 'red' : 'gray' }} />
            </ToolbarIcon>
          </Toolbar>
        </Box>
      </Box>

      <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <div
          style={{
            paddingTop: '5px', paddingBottom: '5px', paddingLeft: '12px', paddingRight: '12px',
            width: '100%', background: '#14151A', color: 'white', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ paddingLeft: 50 }}>
            $ <span style={{ color: '#80ff80' }}>batchai</span>
            &nbsp;&nbsp;{globalOptions.join(' ')}
            <span style={{ color: '#80ff80' }}>&nbsp;&nbsp;{commandName}</span>
            &nbsp;&nbsp;{commandOptions.join(' ')}
            &nbsp;&nbsp;.
            &nbsp;&nbsp;{targetPaths.join(' ')}
          </div>
          <IconButton onClick={handleCopy} color="primary" aria-label="copy command">
            <ContentCopyIcon />
          </IconButton>
        </div>
        {
          (status == CommandStatus.Queued || status == CommandStatus.Running) && (<Box sx={{ width: '100%' }}>
            <LinearProgress />
          </Box>)
        }
        <Tabs sx={{ mt: 1 }} value={logTabIndex} onChange={onChangeLogTab} aria-label="basic tabs example">
          <Tab label={t("Changes")} sx={{ color: 'lightgray' }} {...a11yProps(0)} />
          <Tab label={t("Execution Log")} sx={{ color: 'lightgray' }} {...a11yProps(1)} />
          <Tab label={t("Audit Log")} sx={{ color: 'lightgray' }} {...a11yProps(2)} />
        </Tabs>
        <CustomTabPanel value={logTabIndex} index={0}>
          <Box width={'100%'} sx={{ ml: 1, mb: 1, display: 'flex', flexDirection: 'row' }}>
            {hasChanges ?
              <>
                <Typography sx={{ color: 'lightgray' }}>Commit:</Typography>
                <Link sx={{ ml: 2 }} href={commitUrl || '#'}>{commitUrl || 'N/A'}</Link>
              </>
              :
              <Typography sx={{ color: 'lightgray' }}>No commit yet</Typography>
            }
          </Box>
          {diffs.map((diff, index) =>
            <ReactDiffViewer key={diff.path} useDarkTheme splitView leftTitle={`${index + 1}. ${diff.path}`}
              styles={{ contentText: { fontSize: '13px' }, lineNumber: { fontSize: '13px' }, codeFold: { fontSize: '13px' } }}
              oldValue={diff.oldContent} newValue={diff.newContent}
            />
          )}
        </CustomTabPanel>
        <CustomTabPanel value={logTabIndex} index={1}>
          <ExecutionLogViewer logs={executionLogs} />
        </CustomTabPanel>
        <CustomTabPanel value={logTabIndex} index={2}>
          <AuditLogViewer logs={auditLogs} />
        </CustomTabPanel>
      </Box>

      <Drawer anchor='right' open={showProgress} onClose={toggleProgress(false)}>
        <Stepper sx={{ margin: 4 }} activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => {
            return (
              <Step key={step.status} completed={index <= activeStep && (!step.needChanges || (step.needChanges && hasChanges))}>
                <StepLabel error={index === (activeStep + 1) && status == CommandStatus.Failed}>{step.label}</StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Drawer>

      {command && <CommandDialog data={CommandEditData.forUpdate(s, command)} open={openCommandDialog} setOpen={setOpenCommandDialog} onSubmited={onRefreshPage} />}

    </>
  );
}

