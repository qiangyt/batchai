import React, { useState, useCallback } from 'react';
import { InputAdornment, OutlinedInput } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import _ from 'lodash';
import {useTranslation} from '@/lib/i18n';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const { t } = useTranslation();

  // Debounced function to call the API with the search query
  const debouncedSearch = useCallback(
    _.debounce((q) => {
      onSearch(q);
    }, 300),
    [] // empty dependency array ensures debounce function is stable
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  return (
    <OutlinedInput
      placeholder={t("Type a github repository path")}      value={query}
      onChange={handleChange}
      fullWidth
      startAdornment={
        <InputAdornment position="start">
          <SearchIcon fontSize="large" />
        </InputAdornment>
      }
      sx={{
        borderRadius: '999px',
        height: '48px',
        '& .MuiOutlinedInput-notchedOutline': {
          borderRadius: '999px',
          borderColor: '#333333',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: '#4A90E2',
          transition: 'border-color 0.3s ease',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: '#4A90E2',
        },
        '& input': {
          color: 'white',
        },
        '& .MuiSvgIcon-root': {
          color: '#333333',
          transition: 'color 0.3s ease',
        },
        '&:hover .MuiSvgIcon-root': {
          color: '#4A90E2',
        },
        '&.Mui-focused .MuiSvgIcon-root': {
          color: '#4A90E2',
        },
        paddingLeft: 1.5,
        paddingRight: 1.5,
      }}
    />
  );
};
