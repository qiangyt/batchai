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

import { RepoBasic, useSession, Page } from '@/lib';
import React, { useEffect, useState } from 'react';
import * as repoApi from '@/api/repo.api';
import { useRouter } from 'next/navigation';
import Avatar from '@mui/material/Avatar';
import { CommandCell } from '@/components/repos/command-cell';
import TablePagination from '@mui/material/TablePagination';
import { useUIContext } from '@/lib/ui.context';


export default function RepoList() {
  const [page, setPage] = useState<Page<RepoBasic>>({limit: 10, elements:[]});
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const s = useSession().state;
  const ui = useUIContext();
  const router = useRouter();

  useEffect(() => {
    const QueryRepo = async () => {
      ui.setLoading(true);
      try {
        const p = await repoApi.QueryRepo(s, ui);
        setPage(p);
      } catch(err) {
        ui.setError(err);
      } finally {
        ui.setLoading(false);
      }
    };
    QueryRepo();
  }, [s, ui]);

  const onNewCommand = () => {
    router.push('repos/create');
  }
  
  
  const handleChangePage = (event: unknown, newPageIndex: number) => {
    setPageIndex(newPageIndex);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPageIndex(0);
  };

  return (<>
      <NextLink href="/repos/create" passHref>
        <Button variant="outlined" color="primary" onClick={onNewCommand}>
          New...
        </Button>
      </NextLink>
      <TableContainer >
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell align="left">Path</TableCell>
                <TableCell align="left">"check"</TableCell>
                <TableCell align="left">"test"</TableCell>
                <TableCell align="left"><PersonOutlinedIcon/></TableCell>
                <TableCell align="left">Created At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
            {page.elements.map((repo) => (
                <TableRow key={repo.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}                >
                  <TableCell component="th" scope="row"><Link href={repo.repoUrl}>{repo.repoPath()}</Link></TableCell>
                  <TableCell>
                    <CommandCell repoPath={repo.repoPath()} commandText='review' command={repo.checkCommand}/>
                  </TableCell>
                  <TableCell>
                    <CommandCell repoPath={repo.repoPath()} commandText='test' command={repo.testCommand}/>
                  </TableCell>
                  <TableCell component="th" scope="row">
                    <Link href={repo.owner.githubProfileUrl}>
                      <Avatar alt={repo.creater.displayName} src={repo.creater.avatarUrl}/>
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
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={page.total}
          rowsPerPage={page.limit}
          page={page.page - 1}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
    </>
  );
}
