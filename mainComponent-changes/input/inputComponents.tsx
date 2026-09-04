import { DateRange, ExpandLess, ExpandMore, Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, Checkbox, Collapse, FormControl, FormControlLabel, IconButton, InputAdornment, InputLabel, List, ListItem, ListItemButton, ListItemText, MenuItem, Select, Switch, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material";
import { StyledEngineProvider } from "@mui/material/styles";
import { ClearIcon, DatePicker, DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ruRU } from "@mui/x-date-pickers/locales";
import { format, parseISO } from "date-fns";
import { ru } from 'date-fns/locale';
import dayjs from 'dayjs';
import { useField } from "formik";
import React, { Fragment, HtmlHTMLAttributes, useEffect, useMemo, useRef, useState } from "react";
import { getMonthName } from "../utils/dateFormatter";
import { useFetchSelectContent, useMultiFetchSelectContent } from "./hooks/useFetchSelectContent";

export const DynamicDateList = ({
    dates,
    selectedDate,
    setSelectedDate,
    yearSelectable = false,
    ...props
}) => {
    const [openYear, setOpenYear] = useState<number|null>(null);

    const toggleSubItem = (year) => {
        setOpenYear(prevYear => prevYear === year ? null : year);
    };

    // yearSelectable: клик по невыбранному году выбирает его целиком (selectedDate = 'yyyy'),
    // повторный клик по выбранному — сворачивает/разворачивает список месяцев
    const handleYearClick = (year) => {
        if (yearSelectable && selectedDate !== String(year)) {
            setSelectedDate(String(year));
            setOpenYear(year);
            return;
        }
        toggleSubItem(year);
    };

    useEffect(() => {
        if (selectedDate){
            // Выбран целый год ('yyyy') — не нормализуем в yyyy-MM-dd, только раскрываем его
            if (/^\d{4}$/.test(String(selectedDate))) {
                setOpenYear(parseInt(selectedDate, 10));
                return;
            }
            setSelectedDate(format(new Date(selectedDate), 'yyyy-MM-dd'));
            const yearFromDate = parseInt(selectedDate.split('-')[0], 10);
              if (!isNaN(yearFromDate)) {
                setOpenYear(yearFromDate);
            }
        } else {
            setOpenYear(null)
        }
    }, [selectedDate]);

    useEffect(() => {
        const handleStorageChange = () => {
            setSelectedDate(null);
            setOpenYear(null);
        };
      
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
      }, []);

    return (
        <StyledEngineProvider injectFirst>
        <div {...props}>
            <List component="nav" className="flex-col">
                {dates.map((item) => (
                    <Fragment key={item.year}>
                        <>
                            <ListItem
                                disablePadding
                            >
                                <ListItemButton
                                    onClick={() => handleYearClick(item.year)}
                                    selected={yearSelectable && selectedDate === String(item.year)}
                                    sx={{
                                         padding: '8px 12px',
                                         display: 'flex',
                                         userSelect: 'none',
                                         '&.Mui-selected': {
                                            backgroundColor: 'rgba(25, 118, 210, 0.08)', // Светло-синий фон
                                            color: '#1976d2', // Цвет текста
                                            fontWeight: 'bold',
                                            '&:hover': {
                                                backgroundColor: 'rgba(25, 118, 210, 0.12)',
                                            },
                                         },
                                    }}
                                >
                                    {
                                        <>
                                            <ListItemText
                                                sx={{
                                                }} 
                                                primary={item.year}
                                            />
                                            {openYear === item.year ? <ExpandLess/> : <ExpandMore/>}
                                        </>
                                    }
                                </ListItemButton>
                            </ListItem>
                            <Collapse in = {openYear === item.year} timeout="auto" unmountOnExit>
                                <List
                                    component="div" 
                                    disablePadding
                                >
                                    {item.month.map((month) =>(
                                            <ListItemButton
                                                onClick={() => setSelectedDate(format(new Date(item.year, month - 1, 1), 'yyyy-MM-dd'))}
                                                selected={selectedDate === format(new Date(item.year, month - 1, 1), 'yyyy-MM-dd')}
                                                key={month}
                                                sx={{
                                                    padding: '8px 12px',
                                                    display: 'flex',
                                                    userSelect: 'none',
                                                    '&.Mui-selected': {
                                                    backgroundColor: 'rgba(25, 118, 210, 0.08)', // Светло-синий фон
                                                    color: '#1976d2', // Цвет текста
                                                    fontWeight: 'bold',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(25, 118, 210, 0.12)',
                                                    },
                                                    },
                                               }}
                                            >
                                                <ListItemText 
                                                    sx={{
                                                    }} 
                                                    primary={getMonthName(month)}
                                                />
                                            </ListItemButton>
                                    ))}
                                </List>
                            </Collapse>
                        </>
                    </Fragment>
                ))}
            </List>
        </div>
        </StyledEngineProvider>
    );
}

export const DynamicDatePicker = ({
    value,
    label = "",
    onChange,
    isButtonHide = false,
    isClearable = false,
    size = 'medium',
    ...props
}) => {    
    const [selectedDate, setSelectedDate] = useState<any>(null);

    useEffect(() => {
        if (value) {
            setSelectedDate(parseISO(value));
        } else {
            setSelectedDate(null);
        }
    }, [value])
    
    
    return(
        <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={ru}
            localeText={ruRU.components.MuiLocalizationProvider.defaultProps.localeText}
            
        >
            
                <DateTimePicker 
                    {...props}
                    className="w-full py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                    value={selectedDate}
                    fullWidth
                    onChange={(e) => {
                        setSelectedDate(e); 
                        if (e && dayjs(e).isValid()) {
                            onChange(dayjs(e).format('YYYY-MM-DD[T]HH:mm:ss'));
                        } else {
                            onChange(null);
                        } 
                    }}
                    label={label}
                    minDateTime={new Date(2000, 0, 1)}
                    maxDateTime={new Date(2101, 0, 1)}
                    slotProps={{
                        textField: {
                            //@ts-expect-error
                            size: size,
                            InputLabelProps: { shrink: true },
                            inputProps: { spellCheck: false }
                        },
                        openPickerButton: isButtonHide ? { style: { display: 'none' } } : {}, 
                        field: {
                            clearable: isClearable
                        }
                    }}
                    sx={{
                        minWidth: 0,
                        flexShrink: 1,
                        maxWidth: '100%',
                        "& input:-webkit-autofill": {
                        // Это уберет желтый фон, заменив его на белый (или любой другой)
                        WebkitBoxShadow: "0 0 0 1000px white inset",
                        WebkitTextFillColor: "inherit", // Сохранит цвет текста темы
                        },
                        '& .MuiInputLabel-root': {
                        fontSize: '1.25rem',
                        
                        '&.MuiInputLabel-shrink': {
                            transform: 'translate(14px, -11px) scale(0.75)', 
    
                            backgroundColor: '#fff',
                            padding: '0 6px',
                            marginLeft: '-4px',
                        }
                        },
                    }}
                />
            
        </LocalizationProvider>
    );
}

interface InputProps{
    value: any,
    onChange? : any,
    debounce? : number,
    placeholder?: string,
    label?: string,
    id? : string,
    name?: string,
    variant?,
    size?,
    disabled?,
    allowClear?,
    multiline?,
}

export const DebouncedInput = ({
    value: initialValue,
    onChange, 
    debounce = 300,
    label = '',
    placeholder = '',
    id,
    variant = "outlined",
    size="medium",
    allowClear = false,
    multiline=false,
    ...props
}: InputProps) => {
    const [value, setValue] = useState(initialValue);

    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        if (value === initialValue) return; 

        const timeout = setTimeout(() => {
            onChange(value);
        }, debounce);

        return () => clearTimeout(timeout);

    }, [value, debounce, onChange]);

    const handleClear = () => {
        setValue('');
        onChange('');
    };
    
    return(
        <Tooltip title={label.length > 30 ? label : ""} placement="top-start" arrow enterDelay={500} disableInteractive>
            <TextField
                {...props}
                multiline={multiline}
                fullWidth
                value={value}
                label={label}
                placeholder={placeholder}
                variant={variant}
                autoComplete="props.id"
                name={id}
                size={size}
                //maxRows={5}
                InputLabelProps={{ shrink: true }}
                inputProps={{ 
                    onFocus: (e) => e.target.select(),
                }}
                InputProps={{ 
                    endAdornment: value && allowClear && (
                        <InputAdornment position="end">
                          <IconButton onClick={handleClear} edge="end" size="small">
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                    )
                }}
                onChange={(e)=>{setValue(e.target.value)}}
                sx={{
                    minWidth: 0,
                    flexShrink: 1,
                    maxWidth: '100%',
                    "& input:-webkit-autofill": {
                    // Это уберет желтый фон, заменив его на белый (или любой другой)
                    WebkitBoxShadow: "0 0 0 1000px white inset",
                    WebkitTextFillColor: "inherit", // Сохранит цвет текста темы
                    },
                    '& .MuiInputLabel-root': {
                    fontSize: '1.25rem',
                    
                    '&.MuiInputLabel-shrink': {
                        transform: 'translate(14px, -11px) scale(0.75)', 

                        backgroundColor: '#fff',
                        padding: '0 6px',
                        marginLeft: '-4px',
                    }
                    },
                }}
            />
        </Tooltip>
    );
};

export const DebouncedParamInput = ({
    value: initialValue,
    onChange, 
    debounce = 200,
    label = '',
    placeholder = '',
    id,
    variant = "outlined",
    ...props
}: InputProps) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);
    
    return(
        <Box>
            <Typography 
                variant="caption" 
                sx={{ display: 'block', mb: 0.5, color: 'text', fontWeight: 500, fontSize: '12px' }}
            >
                {label}
            </Typography>
            <TextField
                {...props}
                fullWidth
                value={value}
                placeholder={placeholder}
                variant={variant}
                autoComplete="props.id"
                name={id}
                InputLabelProps={{ shrink: true }}
                inputProps={{ onFocus: (e) => e.target.select() }}
                onChange={(e)=>{setValue(e.target.value), onChange(e.target.value)}}
                size="small"
                sx={{
                    minWidth: 0,
                    flexShrink: 1,
                    maxWidth: '100%',
                    "& input:-webkit-autofill": {
                    // Это уберет желтый фон, заменив его на белый (или любой другой)
                    WebkitBoxShadow: "0 0 0 1000px white inset",
                    WebkitTextFillColor: "inherit", // Сохранит цвет текста темы
                    },
                    
                }}
            />
        </Box>
    );
};

interface DynamicSelectProps{
    contentApi: String,
    value: any,
    onChange: any,
    placeholder?: string,
    params?: any,
    label?: string,
    size?,
    disabled?,
    emptyMenu?,
    defaulValue?
    selectFirst?
}

export const DynamicSelect = ({
    contentApi,
    value: initialValue,
    onChange,
    label = '',
    params,
    placeholder,
    emptyMenu = true,
    defaulValue = '',
    size="medium",
    selectFirst= false,
    ...props
} : DynamicSelectProps & HtmlHTMLAttributes<HTMLSelectElement>) => {
    const fetchParams = useMemo(() => (params), [JSON.stringify(params)])
    const {content, loadingContent} = useFetchSelectContent<any>(contentApi, fetchParams)
    const [selectedItem, setSelectedItem] = useState(initialValue);

    useEffect(() => {
        setSelectedItem(initialValue);
    }, [initialValue])

    useEffect(() => {
        if (!content || content.length === 0) return;
        if (selectFirst && content[0].id) {
            onChange(content[0].id);           
            setSelectedItem(content[0].id);
        } else if (selectedItem !== undefined && selectedItem !== null && selectedItem !== '') {
            const isItemInList = content.some(item => String(item.id) === String(selectedItem));
            if (!isItemInList) {
                onChange(defaulValue);           
                setSelectedItem(defaulValue);
            }
        }
    }, [content]);

    return (
        <FormControl fullWidth size={size}>
            <InputLabel id={props.id} shrink
                    sx={{
                        fontSize: '1.2rem',
                        '&.MuiInputLabel-shrink': {
                            transform: 'translate(14px, -11px) scale(0.75)', // Сдвигаем чуть выше, чтобы не пересекал рамку
                            backgroundColor: '#fff',
                            padding: '0 6px',
                            marginLeft: '-4px',
                          } 
                      }}    
            >{label}</InputLabel>
            
                <Select
                    value={content.some(item => String(item.id) === String(selectedItem)) ? selectedItem : defaulValue}
                    //value={selectedItem}
                    label={label} // Нужно для корректного выреза в рамке (notched outline)
                    // displayEmpty
                    labelId={props.id}
                    name={props.id}
                    disabled={props.disabled}
                    displayEmpty
                    notched // Оставляет место под метку сверху
                    onChange={(e) => {onChange(String(e.target.value)), setSelectedItem(e.target.value)}}                >
                    { emptyMenu && <MenuItem value=""><em>{placeholder}</em></MenuItem>}
                    {content.map(item => (
                        <MenuItem key={item.id} value={item.id}>{item.nm}</MenuItem>
                    ))} 
                </Select>
            
        </FormControl>
    )
};

export const NativeDynamicSelect = ({
    contentApi,
    value: initialValue,
    onChange,
    params,
    placeholder,
    emptyMenu = true,
    defaulValue = '',
    selectFirst = false,
    ...props
}: DynamicSelectProps & HtmlHTMLAttributes<HTMLSelectElement>) => {
    
    const fetchParams = useMemo(() => (params), [JSON.stringify(params)]);
    const { content, loadingContent } = useMultiFetchSelectContent<any>(contentApi, fetchParams);
    const [selectedItem, setSelectedItem] = useState(initialValue);

    const selectRef = useRef<HTMLSelectElement>(null);
    useEffect(() => {
        if (!loadingContent && selectRef.current) {
            selectRef.current?.focus();
        }
    }, [loadingContent, selectRef]);

    useEffect(() => {
        setSelectedItem(initialValue);
    }, [initialValue]);

    useEffect(() => {
        if (!content || content.length === 0) return;
        if (selectFirst && content[0].id) {
            onChange(content[0].id);           
            setSelectedItem(content[0].id);
        } else if (selectedItem !== undefined && selectedItem !== null && selectedItem !== '') {
            const isItemInList = content.some(item => String(item.id) === String(selectedItem));
            if (!isItemInList) {
                onChange(defaulValue);           
                setSelectedItem(defaulValue);
            }
        }
    }, [content]);

    const currentValue = content.some(item => String(item.id) === String(selectedItem)) ? selectedItem : defaulValue;

    return (
        <div className="inline-flex flex-col relative w-full">
            <select
                id={props.id}
                name={props.id}
                value={currentValue}
                disabled={props.disabled || loadingContent}
                ref={selectRef}
                onChange={(e) => {
                    const val = e.target.value;
                    onChange(String(val));
                    setSelectedItem(val);
                }}
                onBlur={props.onBlur}
                onInput={props.onBlur}
            >
                {emptyMenu && (
                    <option value="">
                        {placeholder}
                    </option>
                )}
                
                {content.map(item => (
                    <option key={item.id} value={item.id}>
                        {item.nm}
                    </option>
                ))}
            </select>
        </div>
    );
};

export const DynamicParamSelect = ({
    contentApi,
    value: initialValue,
    onChange,
    label = '',
    params = '',
    placeholder,
    emptyMenu = true,
    defaulValue = '',
    ...props
} : DynamicSelectProps & HtmlHTMLAttributes<HTMLSelectElement>) => {
    const fetchParams = useMemo(() => (params), [JSON.stringify(params)])
    const {content, loadingContent} = useFetchSelectContent<any>(contentApi, fetchParams)
    const [selectedItem, setSelectedItem] = useState(initialValue);

    useEffect(() => {
        // Если данные загружены и текущего значения нет в списке
        if (content.length > 0 && !content.find(item => String(item.id) ===  String(selectedItem))) { 
            onChange(String(defaulValue))           
            setSelectedItem(defaulValue);
        }
    }, [content, selectedItem]);

    return (
        <Box >
            <Typography 
            variant="caption" 
            sx={{ display: 'block', color: 'text', fontWeight: 500, fontSize: '12px' }}
        >
            {label}
        </Typography>
            <FormControl fullWidth size="small">
                {/* <InputLabel id={props.id} shrink>{label}</InputLabel> */}
                {content.length > 0 && (
                    <Select
                        value={content.some(item => String(item.id) === String(selectedItem)) ? selectedItem : defaulValue}
                        labelId={props.id}
                        name={props.id}
                        disabled={props.disabled}
                        notched
                        onChange={(e) => {onChange(String(e.target.value)), setSelectedItem(e.target.value)}}
                    >
                        { emptyMenu && <MenuItem value=""><em></em></MenuItem>}
                        {content.map(item => (
                            <MenuItem key={item.id} value={item.id}>{item.nm}</MenuItem>
                        ))}
                    </Select>
                )}
            </FormControl>
        </Box>
    )
};

export const CheckBox = ({
    value: initialValue,
    onChange,
    label,
    ...props
}) => {
    const [isChecked, setIsChecked] = useState(initialValue == '1');
    useEffect(() => {
        setIsChecked(initialValue == '1');
    }, [initialValue]);
    return(
        <FormControlLabel
            control={
                <Checkbox
                    {...props}
                    checked={isChecked}
                    onChange={(e) => {
                        onChange(e.target.checked ? '1' : '0');
                        setIsChecked(e.target.checked);
                    }}
                    color="primary"
                />
            }
            label={label}
        />
    )
}

export const SwitchImput = ({
    value: initialValue,
    onChange,
    name,
    ...props
}) => {
    const [isChecked, setIsChecked] = useState(initialValue === '1');
    return(
        <div className="text-sm font-medium text-gray-700">
            <FormControlLabel
                control={<Switch checked={isChecked} onChange={(e) => {onChange(e.target.checked ? '1' : '0'), setIsChecked(e.target.checked)}}/>}
                label={isChecked ? "Закрыт" : "Открыт"}
                labelPlacement="end" // или "start" для текста слева
            />
        </div>
    )
}

export const RangePicker = ({
    onChange,
    value,
    label,
    //variant = "standard", 
    ...props
}) => {
    const [start, setStart] = useState<any>(value.dateBegin);
    const [end, setEnd] = useState<any>(value.dateEnd);
    
    useEffect(() => {
        onChange({begin: dayjs(start).format('YYYY-MM-DD[T]HH:mm:ss'), end: dayjs(end).format('YYYY-MM-DD[T]HH:mm:ss')})
    }, [])

    return (
        <Box
            className="relative flex items-center gap-4 px-4 pt-4 pb-2 m-0 transition-colors bg-white dark:bg-zinc-900"
            sx={{
                border: '1px solid rgba(0, 0, 0, 0.23)', 
                borderRadius: '4px',
                '&:hover': {
                    borderColor: 'rgba(0, 0, 0, 0.87)',
                },
                '&:focus-within': {
                    borderColor: '#1976d2',
                    '& .mui-external-label': {
                        color: '#1976d2',
                    }
                }
            }}
        >
            {label && (
                <span 
                    className="absolute -top-[9.5px] left-3 bg-white dark:bg-zinc-900 px-1 text-[13px] font-normal leading-none transition-colors z-10 pointer-events-none "
                    style={{ 
                        color: 'rgba(0, 0, 0, 0.6)',
                        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                    }}
                >
                    {label}
                </span>
            )}

            {/* Провайдер локализации для DatePicker */}
            <LocalizationProvider                 
                dateAdapter={AdapterDateFns}
                adapterLocale={ru}
                localeText={ruRU.components.MuiLocalizationProvider.defaultProps.localeText}
            >
                <DatePicker
                    className="flex-1"
                    views={props.views}
                    openTo="month"
                    slotProps={{
                        textField: {
                            size: "small",
                            variant: "standard",
                            inputProps: {
                                spellCheck: false,
                            },
                        },
                    }} 
                    label="От" 
                    value={start} 
                    onChange={(e) => {
                        setStart(e); 
                        onChange({
                            begin: dayjs(e).format('YYYY-MM-DD[T]HH:mm:ss'), 
                            end: dayjs(end).format('YYYY-MM-DD[T]HH:mm:ss')
                        });
                    }} 
                />

                <DatePicker
                    className="flex-1"
                    views={props.views} 
                    openTo="month" 
                    slotProps={{
                        textField: {
                            size: "small",
                            variant: "standard",
                            inputProps: {
                                spellCheck: false,
                            },
                        },
                    }} 
                    label="До" 
                    value={end} 
                    onChange={(e) => {
                        setEnd(e); 
                        onChange({
                            begin: dayjs(start).format('YYYY-MM-DD[T]HH:mm:ss'), 
                            end: dayjs(e).format('YYYY-MM-DD[T]HH:mm:ss')
                        });
                    }}
                     
                    minDate={start}
                />
            </LocalizationProvider>
        </Box>
    );
};

interface PasswordInputProps{
    value: any,
    onChange? : any,
    debounce? : number,
    placeholder?: string,
    label?: string,
    id? : string,
    confirmpassword? : string,
    variant?
}

export const PasswordInput = ({
    value: initialValue,
    onChange, 
    debounce = 200,
    label = '',
    placeholder = '',
    variant = "outlined",
    id,
    ...props
}: PasswordInputProps) => {
    const [value, setValue] = useState(initialValue);
    const [showPassword, setShowPassword] = useState(false)
    useEffect(()=>{
        const timeout = setTimeout(() => {
            if (value === initialValue)
                return
            onChange(value);
        }, debounce);
        return () => clearTimeout(timeout);
    }, [value])

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    }

    return (
        <TextField
            {...props}
            fullWidth
            value={value}
            label={label}
            placeholder={placeholder}
            variant={variant}
            autoComplete={id}
            name={id}
            InputLabelProps={{ shrink: true }}
            onChange={(e)=>{setValue(e.target.value), onChange(e.target.value)}}
            type={showPassword? 'text' : 'password'}
            sx={{
                "& input:-webkit-autofill": {
                  // Это уберет желтый фон, заменив его на белый (или любой другой)
                  WebkitBoxShadow: "0 0 0 1000px white inset",
                  WebkitTextFillColor: "inherit", // Сохранит цвет текста темы
                },
            }}
            InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClickShowPassword}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
        />
    );
};

export const ChangePasswordInput = ({ label, ...props }) => {
    // useField автоматически связывает компонент с Formik по имени (props.name)
    //@ts-expect-error
    const [field, meta, helpers] = useField(props);
    const [showPassword, setShowPassword] = useState(false);

    // meta.touched — было ли поле в фокусе
    // meta.error — текст ошибки из Yup
    const isError = meta.touched && Boolean(meta.error);

    return (
        <TextField
            {...props}
            {...field} // ПРИВЯЗКА: передает value, name, onChange, onBlur от Formik
            fullWidth
            label={label}
            variant="outlined"
            type={showPassword ? 'text' : 'password'}
            InputLabelProps={{ shrink: true }}
            // Вывод ошибки в стиле Material UI
            error={isError}
            helperText={isError ? meta.error : props.helperText}
            autoComplete="off" 
            sx={{
                "& input:-webkit-autofill": {
                  // Это уберет желтый фон, заменив его на белый (или любой другой)
                  WebkitBoxShadow: "0 0 0 1000px white inset",
                  WebkitTextFillColor: "inherit", // Сохранит цвет текста темы
                },
            }}
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                    </InputAdornment>
                ),
            }}
            inputProps={{ autoComplete: 'new-password' }}
        />
    );
};

export const ReportSign = ({
    onChange,
    value,
    label = ''
}) => {
    const [position, setPosition] = useState<any>(value.position);
    const [fio, setFio] = useState<any>(value.fio);

    return(
        <Box
            className="relative flex items-center gap-4 px-4 pt-4 pb-2 m-0 transition-colors bg-white dark:bg-zinc-900"
            sx={{
                border: '1px solid rgba(0, 0, 0, 0.23)', 
                borderRadius: '4px',
                '&:hover': {
                    borderColor: 'rgba(0, 0, 0, 0.87)',
                },
                
                '&:focus-within': {
                    borderColor: '#1976d2',
                    '& .mui-external-label': {
                        color: '#1976d2',
                    }
                }
            }}
        >
            {label && (
                <span 
                    className="absolute -top-[9.5px] left-3 bg-white dark:bg-zinc-900 px-1 text-[13px] font-normal leading-none transition-colors z-10 pointer-events-none "
                    style={{ 
                        color: 'rgba(0, 0, 0, 0.6)',
                        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                    }}
                >
                    {label}
                </span>
            )}
            
            <div className="flex-1">
                <DebouncedInput 
                    value={position} 
                    onChange={(e) => {setPosition(e); onChange({position: e, fio: fio});}} 
                    label="Должность" 
                    variant="standard"
                    size={"small"}
                />
            </div>
            <div className="flex-1">
                <DebouncedInput 
                    value={fio} 
                    onChange={(e) => {setFio(e); onChange({position: position, fio: e});}} 
                    label="Инициалы, Фамилия" 
                    variant="standard"
                    size={"small"}
                />
            </div>
        </Box>
    )
}

export const ParameterSelector = ({items = [ {id: "createDateRange", label: "Дата создания"}, {id: "begDateRange", label: "Дата начала"}, {id: "endDateRange", label: "Дата окончания"}, ], activeParam, setActiveParam }) => {
    const handleChange = (event, nextParam) => {
        if (nextParam !== null) {
            setActiveParam(nextParam);
        }
    };
  
    return (
        <Box sx={{ mb: 2, width: '100%' }}>        
            <ToggleButtonGroup
                value={activeParam}
                exclusive
                onChange={handleChange}
                orientation="vertical"
                fullWidth
                size="small"
                sx={{
                    '& .MuiToggleButton-root.Mui-selected': {
                        color: '#1976d2',                 
                        backgroundColor: '#D0EBFF',
                        '&:hover': {
                            backgroundColor: '#B1D7FF',
                        },
                    },
                }}
            >
                {
                    items.map((item) => {
                        return (
                            <ToggleButton key={item.id} value={item.id} sx={{justifyContent: "flex-start", textAlign: 'left', color: 'black'}}>
                                <DateRange sx={{ mr: 1, fontSize: 18 }} />
                                {item.label}
                            </ToggleButton>
                        )
                    })
                }
                
            </ToggleButtonGroup>
        </Box>
    );
}
