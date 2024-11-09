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

import { RepoBasic, useSession, Page, RepoSearchParams, SessionState } from '@/lib';
import React, { useEffect, useState } from 'react';
import * as repoApi from '@/api/repo.api';
import { useRouter } from 'next/navigation';
import Avatar from '@mui/material/Avatar';
import { CommandCell } from '@/components/repos/command-cell';
import TablePagination from '@mui/material/TablePagination';
import { UIContextType, useUIContext } from '@/lib/ui.context';
import SearchBar from './search-bar';
import Box from '@mui/material/Box';


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

export default function RepoList() {
  const [page, setPage] = useState<Page<RepoBasic>>({ total: 0, page: 0, limit: 10, elements: [] });
  const s = useSession().state;
  const ui = useUIContext();
  const router = useRouter();

  useEffect(() => {
    searchRepo(s, ui, setPage);
  }, [s, ui]);

  const onNewCommand = () => {
    router.push('repos/create');
  }


  const handleChangePage = (event: unknown, newPageIndex: number) => {
    setPage({...page, page: newPageIndex});
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPage({...page, limit: parseInt(event.target.value, 10), page: 0});
  };

  const handleSearch = async (query: string) => {
    await searchRepo(s, null, setPage, { page: 0, limit: page.limit, query });
  };

  return (<>
    <NextLink href="/repos/create" passHref>
      <Button variant="outlined" color="primary" onClick={onNewCommand}>
        New...
      </Button>
    </NextLink>
    <Box sx={{ width: '36%', minWidth: 400 }}><SearchBar onSearch={handleSearch} /></Box>
    <TableContainer sx={{ mt: 4 }}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell align="left">Path</TableCell>
            <TableCell align="left">"check"</TableCell>
            <TableCell align="left">"test"</TableCell>
            <TableCell align="left"><PersonOutlinedIcon /></TableCell>
            <TableCell align="left">Created At</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {page.elements.map((repo) => (
            <TableRow key={repo.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}                >
              <TableCell component="th" scope="row"><Link href={repo.repoUrl}>{repo.repoPath()}</Link></TableCell>
              <TableCell>
                <CommandCell repoPath={repo.repoPath()} commandText='check' command={repo.checkCommand} />
              </TableCell>
              <TableCell>
                <CommandCell repoPath={repo.repoPath()} commandText='test' command={repo.testCommand} />
              </TableCell>
              <TableCell component="th" scope="row">
                <Link href={repo.owner.githubProfileUrl}>
                  <Avatar alt={repo.creater.displayName} src={repo.creater.avatarUrl} />
                  {repo.creater.displayName}
                </Link>
              </TableCell>
              <TableCell>
                {repo.createdAt.toString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    <TablePagination
      showFirstButton
      showLastButton
      rowsPerPageOptions={[5, 10, 20, 50, 100]}
      component="div"
      count={page.total}
      rowsPerPage={page.limit}
      page={page.page}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
    />
  </>
  );
}
