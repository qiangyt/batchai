/* eslint-disable react/no-unescaped-entities */
"use client";

import Link from '@mui/material/Link';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Masonry from '@mui/lab/Masonry';
import Image from 'next/image';
import { RepoBasic, useSession, Page, RepoSearchParams, SessionState, CommandBasic, CommandDetail, otEvent, ParsedRepoPath } from '@/lib';
import React, { useEffect, useRef, useState } from 'react';
import * as repoApi from '@/api/repo.api';
import DownloadIcon from '@mui/icons-material/FileDownloadOutlined';
import Avatar from '@mui/material/Avatar';
import { UIContextType, useUIContext } from '@/lib/ui.context';
import SearchBar from './search-bar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { CommandChip } from '../../components/command-chip';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import TextField from '@mui/material/TextField';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import LockIcon from '@mui/icons-material/LockOutlined';
import UnlockIcon from '@mui/icons-material/NoEncryptionOutlined';
import { CircularProgressWithLabel } from '@/components/circular-progress-with-label';
import Backdrop from '@mui/material/Backdrop';
import {useTranslation} from '@/lib/i18n';


async function searchRepo(s: SessionState, ui: UIContextType, setPage: React.Dispatch<React.SetStateAction<Page<RepoBasic>>>, params?: RepoSearchParams) {
  if (ui) ui.setLoading(true);
  try {
    const p = await repoApi.searchRepo(s, ui, params);
    setPage(p);
  } catch (err) {
    if (ui) ui.setError(err);
  } finally {
    if (ui) ui.setLoading(false);
  }
}

const Item = styled(Paper)(({ theme }) => ({
  minWidth: 420,
  padding: theme.spacing(3),
  borderRadius: 0,
  backgroundColor: 'transparent',
  border: `1px solid ${theme.palette.grey[700]}`,
  transition: 'background-color 0.3s ease',
  '&:hover': {
    backgroundColor: "#21232b",
  },
  color: 'white',
}));



export default function RepoList() {
  const [page, setPage] = useState<Page<RepoBasic>>({ total: 0, page: 0, limit: 100, elements: [] });
  const [newRepoPath, setNewRepoPath] = useState("");
  const [addRepoProgress, setAddRepoProgress] = React.useState(0);
  const [addingRepo, setAddingRepo] = React.useState(false);
  const s = useSession().state;
  const ui = useUIContext();
  const { t } = useTranslation();

  const addNewRepoRef = useRef(null);

  useEffect(() => {
    if (addNewRepoRef.current) {
      addNewRepoRef.current.focus();
    }
  }, []);

  useEffect(() => {
    searchRepo(s, ui, setPage);
  }, [s, ui]);

  const onSearch = async (query: string) => {
    await searchRepo(s, null, setPage, { page: 0, limit: page.limit, query });
  };

  const onCommandCreated = async (newCommand: CommandDetail) => {
    await searchRepo(s, ui, setPage);
  };

  const onAddRepo = async (e) => {
    otEvent(e);
    if (newRepoPath) {
      if (!s.detail || !s.detail.accessToken) {
        ui.signIn({ action: t('add repository') });
        return;
      }

      const parsed = ParsedRepoPath.parse(newRepoPath);
      if (parsed) {
        setAddingRepo(true);
        setAddRepoProgress(5);

        const intervalTimer = setInterval(() => {
          setAddRepoProgress((prevProgress: number) => {
            let newProgress = prevProgress + 2;
            if (newProgress >= 100) {
              return prevProgress;
            }
            return newProgress;
          });
        }, 100);

        try {
          await repoApi.createRepo(s, ui, { path: newRepoPath });
        } catch (err) {
          ui.setError(err);
        } finally {
          clearInterval(intervalTimer);

          setAddRepoProgress(100);
          setTimeout(() => {
            setAddingRepo(false);
          }, 500);
        }

        await searchRepo(s, ui, setPage);
      }
    }
  };

  const onKeyDownNewRepo = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onAddRepo(e);
    }
  };

  const onChangeNewRepoPath = (e) => {
    otEvent(e);
    setNewRepoPath(e.target.value);
  };

  const onLockOrUnlockRepo = async (e, repo: RepoBasic) => {
    otEvent(e);

    if (!s.detail || !s.detail.accessToken) {
      ui.signIn({ action: t('lock/unlock repository') });
      return;
    }

    if (!s.detail.user.admin) {
      ui.setError(t('admin privilege is required'));
      return;
    }

    if (repo.locked) {
      repo = await repoApi.unlockRepo(s, ui, repo.id);
    } else {
      repo = await repoApi.lockRepo(s, ui, repo.id);
    }

    setPage({
      ...page, elements: page.elements.map((element) => {
        if (element.id === repo.id) {
          return repo;
        } else {
          return element;
        }
      })
    });
  };

  const onDeleteRepo = async (e, repo: RepoBasic) => {
    otEvent(e);

    if (!s.detail || !s.detail.accessToken) {
      ui.signIn({ action: t('delete repository') });
      return;
    }

    if (!s.detail.user.admin) {
      ui.setError(t('admin privilege is required'));
      return;
    }

    if (repo.locked) {
      ui.setError(t('this repository is locked'));
      return;
    }

    ui.confirm(
      {
        action: 'delete',
        subject: `${repo.owner.name}/${repo.name}`,
        subjectType: 'repository'
      },
      async () => {
        ui.setLoading(true);
        try {
          await repoApi.removeRepo(s, ui, repo.id);
        } catch (err) {
          ui.setError(err);
        } finally {
          ui.setLoading(false);
        }

        await searchRepo(s, ui, setPage);
      }
    );
  }

  return (<>
    <Box display="flex" flexDirection="column" alignItems="center">
      <Image src={"logo.svg"} alt="batchai" width={348} height={120} />
      <Typography sx={{ fontSize: 18, color: 'white' }} noWrap>{t('SEARCH REPOSITORY')}</Typography>
      <Box sx={{ width: '63.8%' }}><SearchBar onSearch={onSearch} /></Box>
      <Typography sx={{ fontSize: 14 }} color="gray">{t('totally repositories for batchai demostration', {total: page.total})}</Typography>
    </Box>

    <Masonry columns={3} spacing={2} sx={{ mt: 6 }}>
      <Paper key='add' style={{ minWidth: 420, padding: 30, backgroundColor: 'transparent', color: 'white' }}>
        <Fab variant="extended" color="primary" aria-label="add" onClick={onAddRepo}><AddIcon />{t("Your Github")}</Fab>
        <TextField inputRef={addNewRepoRef} required sx={{ mt: 2.3 }} size="small" id="newRepoPath" label={t("Repository Path")} fullWidth variant='outlined'
          onKeyDown={onKeyDownNewRepo} value={newRepoPath} onChange={onChangeNewRepoPath}
          slotProps={{
            input: { sx: { color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'gray' } } },
            inputLabel: { sx: { color: 'gray' } }
          }} />
      </Paper>
      {page.elements.map((repo) => (
        <Item key={repo.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Link href={repo.repoUrl}>
              <Typography sx={{ fontSize: 12, color: '#bbbbbb' }}>{`#${repo.id} ${repo.repoUrl}`}
                {repo.locked ?
                  <UnlockIcon sx={{ ml: 1, color: 'bbbbbb' }} onClick={(e) => onLockOrUnlockRepo(e, repo)} />
                  :
                  <LockIcon sx={{ ml: 1, color: 'bbbbbb' }} onClick={(e) => onLockOrUnlockRepo(e, repo)} />
                }
                <DeleteIcon sx={{ ml: 1, color: 'bbbbbb' }} onClick={(e) => onDeleteRepo(e, repo)} />
              </Typography>
            </Link>
            <Typography variant="h5" sx={{ color: 'white', mt: 1 }}>
              {repo.repoPath(false)}
              <Link href={`/rest/v1/repos/id/${repo.id}/artifact`} download target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'white' }}>
                <DownloadIcon sx={{ ml: 2 }} />
              </Link>
            </Typography>
            <Box sx={{ mt: 4 }}>
              <CommandChip key="check" repo={repo} commandName="check" onCommandCreated={onCommandCreated} />
              <CommandChip key="test" repo={repo} commandName="test" onCommandCreated={onCommandCreated} />
            </Box>
          </Box>
          <Box>
            <Link href={repo.owner.githubProfileUrl}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Avatar alt={repo.creater.displayName} src={repo.creater.avatarUrl} />
                <Typography sx={{ fontSize: 12, mt: 1, color: "#bbbbbb", }}>{repo.creater.displayName}</Typography>
              </Box>
            </Link>
          </Box>
        </Item>
      ))}
    </Masonry>

    <Backdrop sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })} open={addingRepo}>
      <CircularProgressWithLabel value={addRepoProgress} />
    </Backdrop>

  </>
  );
}
