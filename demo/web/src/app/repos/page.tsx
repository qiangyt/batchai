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
import { CommandChip } from './command-chip';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import TextField from '@mui/material/TextField';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';

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
  padding: theme.spacing(3),
  borderRadius: 0,
  backgroundColor: 'transparent',
  border: `1px solid ${theme.palette.grey[700]}`,
  transition: 'background-color 0.3s ease',
  '&:hover': {
    backgroundColor: "#4A90E2",
  },
  color: 'white',
}));



export default function RepoList() {
  const [page, setPage] = useState<Page<RepoBasic>>({ total: 0, page: 0, limit: 100, elements: [] });
  const [newRepoPath, setNewRepoPath] = useState("");
  const s = useSession().state;
  const ui = useUIContext();

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
      const parsed = ParsedRepoPath.parse(newRepoPath);
      if (parsed) {
        ui.setLoading(true);
        try {
        await repoApi.createRepo(s, ui, {path: newRepoPath});
        } catch (err) {
          ui.setError(err);
        } finally {
          ui.setLoading(false);
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

  const onDeleteRepo = async(e, repo:RepoBasic) => {
    otEvent(e);

    ui.confirm(
      {
        action: 'delete', 
        subject: `${repo.owner.name}/${repo.name}`, 
        subjectType: 'repository'
      }, 
      async() => {
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
      <Image src={"logo.svg"} alt="batchai" width={348} height={120}/>
      <Typography sx={{ fontSize: 18, color: 'white' }} noWrap>SEARCH REPOSITORY</Typography>
      <Box sx={{ width: '63.8%' }}><SearchBar onSearch={onSearch} /></Box>      
      <Typography sx={{ fontSize: 14 }} color="gray">{page.total} REPOSITORIES</Typography>
    </Box>

    <Masonry columns={3} spacing={2} sx={{mt:6}}>
      <Paper key='add' style={{padding: 30, backgroundColor: 'transparent', color: 'white'}}>
        <Fab variant="extended" color="primary" aria-label="add" onClick={onAddRepo}><AddIcon />Your Github</Fab>
        <TextField inputRef={addNewRepoRef} required sx={{mt:2.3}} size="small"  id="newRepoPath" label="Repository Path:" fullWidth variant='outlined'
              onKeyDown={onKeyDownNewRepo} value={newRepoPath} onChange={onChangeNewRepoPath}
              slotProps={{
                input: {sx: {color: 'white', '& .MuiOutlinedInput-notchedOutline': {borderColor: 'gray'}}},
                inputLabel: {sx: {color: 'gray'}}
              }}/>
      </Paper>
      {page.elements.map((repo) => (
          <Item key={repo.id} sx={{display: 'flex', justifyContent: 'space-between'}}>
            <Box>
              <Link href={repo.repoUrl}>
                <Typography sx={{fontSize:12, color: '#bbbbbb'}}>{`#${repo.id} ${repo.repoUrl}`}
                  <DeleteIcon sx={{ ml: 1, color: 'bbbbbb' }} onClick={(e) => onDeleteRepo(e, repo)}/>
                </Typography>
              </Link>
              <Typography variant="h5" sx={{color: 'white', mt: 1}}>
                {repo.repoPath(false)}
                <Link href={`/rest/v1/repos/id/${repo.id}/artifact`} download target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'white' }}>
                  <DownloadIcon sx={{ ml: 2}} />
                </Link>
              </Typography>
              <Box sx={{mt: 4}}>
                <CommandChip key="check" repo={repo} commandName="check" onCommandCreated={onCommandCreated}/>
                <CommandChip key="test" repo={repo} commandName="test" onCommandCreated={onCommandCreated}/>
              </Box>
            </Box>
            <Box>
                <Link href={repo.owner.githubProfileUrl}>
                  <Box display="flex" flexDirection="column" alignItems="center">
                  <Avatar alt={repo.creater.displayName} src={repo.creater.avatarUrl} />
                  <Typography sx={{fontSize:12, mt:1, color: "#bbbbbb",}}>{repo.creater.displayName}</Typography>
                  </Box>
                </Link>
            </Box>
          </Item>
      ))}
    </Masonry>
  </>
  );
}
