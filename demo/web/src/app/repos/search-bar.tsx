import React, { useState, useCallback } from 'react';
import { InputAdornment, OutlinedInput } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import _ from 'lodash';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

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
      placeholder="Type a github repository path"
      value={query}
      onChange={handleChange}
      fullWidth
      startAdornment={
        <InputAdornment position="start">
          <SearchIcon fontSize="large" sx={{color: "#333333"}}/>
        </InputAdornment>
      }
      sx={{
        borderRadius: '999px',
        height: '48px',
        '& .MuiOutlinedInput-notchedOutline': {
          borderRadius: '999px',
        },
        '.MuiOutlinedInput-notchedOutline': {
          borderColor: '#333333',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: '#4A90E2',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: '#4A90E2',
        },
        '& input::placeholder': {
          color: '#666666',
          opacity: 1,
        },
        '& input': {
          color: 'white',
        },
        paddingLeft: 1.5,
        paddingRight: 1.5,
      }}
    />
  );
};
