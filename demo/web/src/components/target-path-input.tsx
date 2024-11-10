import { otEvent, SessionState, UIContextType, useSession, useUIContext } from "@/lib";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import { ChangeEvent, Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded';
import * as commandApi from '@/api/command.api';
import _ from 'lodash';


interface TargetPathInputProps {
  id: number;
  targetPaths: string[];
  onChange: (targetPaths:string[]) => void;
}

async function refreshAvailableTargetPaths(s: SessionState, ui: UIContextType, id: number, prefix:string, setAvailableTargetPaths: Dispatch<SetStateAction<string[]>>) {
  if (id) {
    if (prefix.startsWith('/')) prefix = prefix.slice(1);
	  if (prefix.endsWith('/')) prefix = prefix.slice(0, prefix.length - 1);

    const paths = await commandApi.listAvaiableTargetPaths(s, ui, id, {path: prefix});
    setAvailableTargetPaths(paths.map(p => prefix ? prefix + '/' + p : p));
  }
}

export default function TargetPathInput({ id, targetPaths, onChange }: TargetPathInputProps) {
  const s = useSession().state;
  const ui = useUIContext();

  const [targetPath, setTargetPath] = useState('');
  const [availableTargetPaths, setAvailableTargetPaths] = useState([]);
  
  useEffect(() => {
    refreshAvailableTargetPaths(s, ui, id, '', setAvailableTargetPaths);
  }, [s, ui, id]);
  
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onAddTargetPath();
      return;
    }
  };

  const onTargetPathInputChange = (e) => {
    //otEvent(e);

    const path:string = e.target.value;
    setTargetPath(path);

    if (id && path.endsWith('/')) {
      refreshAvailableTargetPaths(s, ui, id, path, setAvailableTargetPaths);
    }
  };

  const onTargetPathChange = (e) => {
    otEvent(e);
    setTargetPath(e.target.value);
  };

  const onAddTargetPath = () => {
    if (targetPath.trim()) {
      onChange([targetPath, ...targetPaths]);
      setTargetPath('');
    }
  };

  const onDeleteTargetPath = (index) => {
    onChange(targetPaths.filter((_, i) => i !== index));
  };

  return <Box sx={{ mt: 3, border: 0.5, borderColor: 'lightgray', borderRadius: 1, padding: 1 }}>
    <Autocomplete size='small' freeSolo fullWidth onKeyDown={onKeyDown}
        options={availableTargetPaths} value={targetPath} 
        onInputChange={onTargetPathInputChange} onChange={onTargetPathChange}
        renderInput={(params) => <TextField {...params} label="Target Path" />}
    />
    <Button variant="contained" color="inherit" onClick={onAddTargetPath} sx={{ mt: 1, mb: 1 }}>
      Add Target Path
    </Button>

    {targetPaths && targetPaths.length > 0 &&
      <List style={{ maxHeight: 200, overflowY: 'auto', border: '0.5px solid #ddd' }}>
        {targetPaths.map((item, index) => (
          <ListItem key={index} divider sx={{ maxHeight: 28 }} secondaryAction={
            <IconButton edge="end" onClick={() => onDeleteTargetPath(index)}>
              <DeleteIcon />
            </IconButton>
          }>
            <ListItemText primary={item} />
          </ListItem>
        ))}
      </List>
    }
  </Box>
}