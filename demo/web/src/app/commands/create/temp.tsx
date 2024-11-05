"use client"

import React, { useState } from 'react';
import { useImmer } from 'use-immer';
import { useRouter } from 'next/navigation';
import * as commandApi from '@/api/command.api';
import { TextField, Button, Container, Typography } from '@mui/material';
import { CommandCreateReq, Session, useSession } from '@/lib';
import { useUIContext } from '@/lib/ui.context';

interface CommandFormProps {
  repoPath: string;
  command: string;
  onSubmit: (params: CommandCreateReq) => void;
}


const CommandForm: React.FC<CommandFormProps> = ({ repoPath, command, onSubmit }) => {
  const [params, updateParams] = useImmer<CommandCreateReq>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any | null>(null);
  
  const handleChange = (e:any) => {
      const { name, value } = e.target;
      updateParams(draft => draft[name] = value);
    };
  
  const handleSubmit = async (event: React.FormEvent) => {
      event.preventDefault();
      event.stopPropagation();

      setLoading(true);
      setError(null);

      try {
          await onSubmit(params);
      } catch (error) {
          setError(error);
      } finally {
          setLoading(false);
      }
  };

  return (
      <Container component="main" maxWidth="xs">
          <Typography variant="h5">Create Command</Typography>
          <form onSubmit={handleSubmit}>
              <TextField
                  disabled   
                  label="Repository"
                  placeholder='Example: https://github.com/qiangyt/batchai'
                  fullWidth
                  margin="normal"
                  value={params.repoPath}
                  required
              />
              <TextField
                  disabled
                  label="Command"
                  fullWidth
                  margin="normal"
                  value={params.command}
                  onChange={handleChange}
                  required
              />
              {error && <Typography color="error">{error}</Typography>}
              <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={loading}
              >
                  {loading ? 'Creating...' : 'Create Command'}
              </Button>
          </form>
      </Container>
  );
};


export default function CreateRepo({repoPath, command}: { repoPath:string, command:string }) {
  const router = useRouter();
  const s = useSession().state;
  const ui = useUIContext();
 
  const handleSubmit = async (params: CommandCreateReq) => {
    const cmd = await commandApi.CreateCommand(s, ui, params);
    router.push('/repos');//TODO: router.push('/commands/${cmd.id}');
  };

  return (
    <CommandForm onSubmit={handleSubmit} repoPath={repoPath} command={command} />
  );
};