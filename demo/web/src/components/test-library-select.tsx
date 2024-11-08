import { otEvent } from "@/lib";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { ChangeEvent } from "react";

class TestLibraryOption {
    value: string;
    label: string;
}

const OPTIONS = [
    { value: null, label: "auto" },
    { value: "JUnit", label: "JUnit (Java)" },
    { value: "TestNG", label: "TestNG (Java)" },
    { value: "Mocha", label: "Mocha (Javascript/Typescript)" },
    { value: "Jest", label: "Jest (Javascript/Typescript)" },
    { value: "Jasmine", label: "Jasmine (Javascript/Typescript)" },
    { value: "testing", label: "testing (Go)" },
    { value: "Testify", label: "Testify (Go)" },
    { value: "PyTest", label: "PyTest (Python)" },
    { value: "NUnit", label: "NUnit (C#)" },
    { value: "Google.Test", label: "Google Test (C++)" },
    { value: "Boost.Test", label: "Boost.Test (C++)" },
    { value: "CppUnit", label: "CppUnit (C++)" },
    { value: "rSpec", label: "rSpec (Ruby)" },
    { value: "PHPUnit", label: "PHPUnit (PHP)" },
    { value: "XCTest", label: "XCTest (Swift)" }
];

function lookupOption(value: string | TestLibraryOption): TestLibraryOption {
    let textValue: string;

    if (!value) {
        textValue = null;
    } else if (typeof value !== 'string') {
        textValue = value.value;
    } else {
        textValue = value;
    }

    const options = OPTIONS.filter((opt) => opt.value === textValue);
    if (options.length) {
        return options[0];
    }

    const r = { value: textValue, label: textValue };
    OPTIONS.push(r);
    return r;
}

interface TestLibrarySelectProps {
    value: string;
    onChange: (newValue: string) => void;
}

export default function TestLibrarySelect({ value, onChange }: TestLibrarySelectProps) {
    const option = lookupOption(value);

    const onChangeLibrary = (e: ChangeEvent<any>, selected: any) => {
        otEvent(e);
        const newValue = lookupOption(selected).value;
        onChange(newValue);
    };

    return <Autocomplete size='small' freeSolo
        options={OPTIONS} 
        getOptionLabel={(option:any) => option.label}  
        getOptionKey={(option: any) => option.value}
        value={option} 
        onChange={onChangeLibrary}
        renderInput={(params) => <TextField {...params} label="Test Library" />}
    />
}