/* eslint-disable react/no-unescaped-entities */
"use client";

import NextLink from 'next/link'
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Masonry from '@mui/lab/Masonry';
import Image from 'next/image';
import { RepoBasic, useSession, Page, RepoSearchParams, SessionState, CommandBasic } from '@/lib';
import React, { useEffect, useState } from 'react';
import * as repoApi from '@/api/repo.api';
import { useRouter } from 'next/navigation';
import Avatar from '@mui/material/Avatar';
import { CommandCell } from '@/components/repos/command-cell';
import TablePagination from '@mui/material/TablePagination';
import { UIContextType, useUIContext } from '@/lib/ui.context';
import SearchBar from './search-bar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

async function searchRepo(s: SessionState, ui: UIContextType, setPage: React.Dispatch<React.SetStateAction<Page<RepoBasic>>>, params?: RepoSearchParams) {
  if (ui) ui.setLoading(true);
  try {
    const p = await repoApi.SearchRepo(s, ui, params);
    setPage(p);
  } catch (err) {
    if (ui) ui.setError(err);
  } finally {
    if (ui) ui.setLoading(false);
  }
}

const Item = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: 'transparent',
  border: `1px solid ${theme.palette.grey[700]}`,
  transition: 'background-color 0.3s ease',
  '&:hover': {
    backgroundColor: "#4A90E2",
  },
}));

function CommandChip({ repo, command, commandId }: {repo: RepoBasic, command: string, commandId: number}) {
  if (commandId) {
    return (
      <NextLink href={{ pathname: `/commands/${commandId}`, query: {id:commandId} }} passHref>
        <Chip sx={{color:"white"}} label={`batchai ${command}`} variant="outlined" />;
      </NextLink>
    )
  }

  return (
    <NextLink href={{ pathname: "/commands/create", query: {command} }} passHref>
      <Chip sx={{color:"white"}} label={`batchai ${command}`} variant="outlined" />
    </NextLink>
  )
}


export default function RepoList() {
  const [page, setPage] = useState<Page<RepoBasic>>({ total: 0, page: 0, limit: 100, elements: [] });
  const s = useSession().state;
  const ui = useUIContext();
  const router = useRouter();

  useEffect(() => {
    searchRepo(s, ui, setPage);
  }, [s, ui]);

  const onNewCommand = () => {
    router.push('repos/create');
  }

  const handleSearch = async (query: string) => {
    await searchRepo(s, null, setPage, { page: 0, limit: page.limit, query });
  };

  return (<>
    <Box display="flex" flexDirection="column" alignItems="center">
      <Image src={"logo.svg"} alt="batchai" width={348} height={120}/>
      <Typography sx={{ fontSize: 18, color: 'white' }} noWrap>SEARCH REPOSITORY</Typography>
      <Box sx={{ width: '63.8%' }}><SearchBar onSearch={handleSearch} /></Box>      
      <Typography sx={{ fontSize: 14 }} color="gray">{page.total} REPOSITORIES</Typography>
    </Box>
    <Masonry columns={3} spacing={2} sx={{mt:6}}>
      {page.elements.map((repo) => (
          <Item key={repo.id} sx={{display: 'flex',justifyContent: 'space-between'}}>
            <Box>
            <Link href={repo.repoUrl}><Typography sx={{fontSize:12, color: '#bbbbbb'}}>{`#${repo.id} ${repo.repoUrl}`}</Typography></Link>
              <Typography variant="h5" sx={{color: 'white'}}>{repo.repoPath(false)}</Typography>
              <Box sx={{mt: 4}}>
                <CommandChip repo={repo} command="check" commandId={repo.checkCommand?.id} />
                <CommandChip repo={repo} command="test" commandId={repo.testCommand?.id} />
              </Box>
            </Box>
            <Box>
                <Link href={repo.owner.githubProfileUrl}>
                  <Avatar alt={repo.creater.displayName} src={repo.creater.avatarUrl} />
                  <Typography sx={{fontSize:12, mt:1, color: "#bbbbbb",}}>{repo.creater.displayName}</Typography>
                </Link>
            </Box>
          </Item>
      ))}
    </Masonry>
  </>
  );
}
