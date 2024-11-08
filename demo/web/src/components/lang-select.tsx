import { otEvent } from "@/lib";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { ChangeEvent } from "react";

class LangOption {
    value: string;
    label: string;
}

const OPTIONS = [
    { value: null, label: "auto" },
    { value: "English", label: "English" },
    { value: "Chinese.Simplified", label: "简体中文" },
    { value: "Chinese.Traditional", label: "繁體中文" },
    { value: "Russian", label: "русский" },
    { value: "Japanese", label: "日本語" },
    { value: "Genman", label: "Deutsch" },
    { value: "French", label: "français" },
    { value: "Spanish", label: "español" },
    { value: "Italian", label: "italiano" },
    { value: "Portuguese", label: "português" },
    { value: "Korean", label: "한국어" },
];

function lookupOption(value: string | LangOption): LangOption {
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

interface LangSelectProps {
    value: string;
    onChange: (newValue: string) => void;
}

export default function LangSelect({ value, onChange }: LangSelectProps) {
    const option = lookupOption(value);

    const onChangeLang = (e: ChangeEvent<any>, selected: any) => {
        otEvent(e);
        const newValue = lookupOption(selected).value;
        onChange(newValue);
    };

    return <Autocomplete size='small' freeSolo
        options={OPTIONS}
        getOptionLabel={(option: any) => option.label}
        getOptionKey={(option: any) => option.value}
        value={option}
        onChange={onChangeLang}
        renderInput={(params) => <TextField {...params} label="Language" />}
    />
}