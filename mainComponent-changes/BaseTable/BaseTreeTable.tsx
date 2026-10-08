import type { ColumnDef, TableOptions, VisibilityState } from "@tanstack/react-table";
import { flexRender, getCoreRowModel, getExpandedRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import React, { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useFetchData } from "../BaseTable/hooks/useFetchTreeData";
import { DebouncedInput, DynamicDatePicker, DynamicSelect } from "../Input/InputComponents";
import { FILTER_TYPES } from "../utils/types";
import { ColumnFilter } from "./BaseTable";
import { nextTreeSelection } from "./rowSelection.js";

interface BaseTreeTableProps<TData> extends Partial<TableOptions<TData>>{
    url: string;
    columns: ColumnDef<TData>[];
    filters?: ColumnFilter<TData>[];
    setFilters?: any;
    setSelectedId?: any;
    setSelectedCol?: any;
    setIsLeaf?:any;
    defColumnVisibility?: VisibilityState;
    reRenderSignal?: number;
    disabled?: boolean;
    getRowBackgroundColor?: (row: TData) => string | undefined;
    clearSelectionSignal?: number;
    /** Ctrl/Cmd переключает строку, Shift выделяет видимый диапазон. Без пропа клик остаётся однострочным. */
    multiSelect?: boolean;
    setSelectedIds?: (ids: any[]) => void;
}


export const BaseTreeTable = <TData,>({url, columns, filters, setFilters, setSelectedId, setSelectedCol, setIsLeaf, defColumnVisibility, reRenderSignal, disabled=false, getRowBackgroundColor, clearSelectionSignal, multiSelect=false, setSelectedIds, ...props}: BaseTreeTableProps<TData>) =>{
    const {data, loading, setData, fetchChildren} = useFetchData<TData>(url, filters || [], reRenderSignal);
    const [expanded, setExpanded] = useState({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(defColumnVisibility || {})
    const [columnSizing, setColumnSizing] = useState(() => {
        const saved = localStorage.getItem(`table-column-sizing:${url}`);
        return saved ? JSON.parse(saved) : {};
    });
    const hasClearSelectionEffectMounted = useRef(false);
    const previousClearSelectionSignal = useRef(clearSelectionSignal);
    const anchorIdRef = useRef<string | null>(null);
    const previousReloadSignal = useRef(reRenderSignal);
    const restoreExpandedRef = useRef(false);
    const dataAtReloadRef = useRef<TData[] | null>(null);
    const restoringIdsRef = useRef(new Set<string>());
    const dataRef = useRef(data);
    dataRef.current = data;
    const [selectionHighlight, setSelectionHighlight] = useState(true);
    const table = useReactTable({
        data,
        columns,
        state: {
            expanded,
            columnVisibility,
            columnFilters : filters,
            columnSizing: columnSizing,
        },
        defaultColumn: {
            enableColumnFilter: false, 
            size: 150,    // Размер по умолчанию, если не указан в columnDef
            minSize: 30,  // Меньше этого значения колонка физически не сожмется
            maxSize: 500, // Больше этого не растянется
        },
        meta:{  
            updateData:(rowId, colId, value) => {       
                setData(prev => prev.map((row, index) =>
                    index === Number(rowId) ? {...row, [colId]:value} : row
                ));
            }
        },
        //@ts-ignore
        getRowId: (row) => String(row.id), 
        getCoreRowModel: getCoreRowModel(),
        //@ts-ignore
        getRowCanExpand: row => row.original.hasChildren,
        onColumnFiltersChange: setFilters,
        getExpandedRowModel: getExpandedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onColumnSizingChange: setColumnSizing,
        //@ts-ignore
        getSubRows: row => row.children,
        onExpandedChange: (updater) => {  
            //@ts-ignore
            const newExpanded = updater(expanded);
            Object.keys(newExpanded)
                .filter(id => newExpanded[id] && !expanded[id])
                .forEach(rowId => {
                    const row = table.getRow(rowId);
                    //@ts-ignore                    
                    if (row.getCanExpand() && !row.original.children) {
                        //@ts-ignore
                        fetchChildren(row.original.id);
                }});
            setExpanded(newExpanded);
        },
        manualPagination: true,
        manualFiltering: true,
        enableSubRowSelection: false,
        enableRowSelection: true,
        columnResizeMode: 'onChange',
        ...props,
    });

    useEffect(() => {
        if (!hasClearSelectionEffectMounted.current) {
            hasClearSelectionEffectMounted.current = true
            previousClearSelectionSignal.current = clearSelectionSignal
            return
        }
        if (clearSelectionSignal !== undefined && previousClearSelectionSignal.current !== clearSelectionSignal) {
            if (multiSelect) setSelectionHighlight(false)
            else table.resetRowSelection()
        }
        previousClearSelectionSignal.current = clearSelectionSignal
    }, [clearSelectionSignal, multiSelect])

    useEffect(() => {
        if (!multiSelect) return
        anchorIdRef.current = null
        setSelectionHighlight(true)
        table.resetRowSelection()
        setSelectedIds?.([])
    }, [url, multiSelect])

    // сохраняем стили с размерами для хранения в стилях таблицы style = {{ ...columnSizeVars}} (убирает инппут лаг при перемещении) 
    const columnSizeVars = useMemo(() => {
        const headers = table.getFlatHeaders()
        const colSizes: Record<string, string> = {}
        
        for (let i = 0; i < headers.length; i++) {
          const header = headers[i]
          colSizes[`--col-${header.column.id}-size`] = `${header.column.getSize()}px`
        }
        
        return colSizes
        // Отслеживаем изменения состояния ресайза
    }, [table.getState().columnSizing, table.getState().columnSizingInfo])

    const handleRowClick = (row, cell) => {        
        if (row.id){
            if(!multiSelect && setSelectedId){
                setSelectedId(row.original.id);
            }
            if(setSelectedCol){
               setSelectedCol(cell.column.id);
            }
        }
    };

    const applyMultiSelect = (event, row) => {
        if (event.shiftKey) event.preventDefault()
        const state = table.getState().rowSelection
        const selectedIds = Object.keys(state).filter((id) => state[id])
        const visibleIds = table.getRowModel().rows.map((item) => item.id)
        const next = nextTreeSelection({
            visibleIds,
            selectedIds,
            anchorId: anchorIdRef.current,
            clickedId: row.id,
            shiftKey: event.shiftKey,
            toggleKey: event.ctrlKey || event.metaKey,
        })
        const selection: Record<string, boolean> = {}
        for (const id of next.selectedIds) selection[id] = true
        table.setRowSelection(selection)
        anchorIdRef.current = next.anchorId
        setSelectionHighlight(true)
        setSelectedIds?.(next.selectedIds.map((id) => originalRowId(table, id)))
    }

    // сохраниение размера колонок
    useEffect(() => {
        localStorage.setItem(`table-column-sizing:${url}`, JSON.stringify(columnSizing));
    }, [columnSizing]);    

    useEffect(() => {
        const hasActiveFilters = filters?.some(f => f.value && String(f.value).trim() !== '');
        
        if (hasActiveFilters && data && data.length > 0) {
            const allExpanded: Record<string, boolean> = {};
            const expandAllNodes = (nodes: any) => {
                nodes.forEach((node) => {
                    if (node.children && node.children.length > 0) {
                        allExpanded[node.id] = true;
                        expandAllNodes(node.children);
                    }
                });
            };
            expandAllNodes(data);          
            setExpanded(allExpanded);
        }
    }, [data]);

    useEffect(() => {
        if (previousReloadSignal.current === reRenderSignal) return
        previousReloadSignal.current = reRenderSignal
        restoreExpandedRef.current = true
        dataAtReloadRef.current = dataRef.current
        restoringIdsRef.current = new Set()
    }, [reRenderSignal])

    useEffect(() => {
        if (!restoreExpandedRef.current) return
        // Сразу после сигнала data ещё прежнее дерево, дети на месте.
        if (data === dataAtReloadRef.current) return
        const byId = new Map()
        const walk = (nodes) => {
            for (const node of nodes ?? []) {
                if (node?.id == null) continue
                byId.set(String(node.id), node)
                if (node.children) walk(node.children)
            }
        }
        walk(data)
        let pending = false
        for (const rowId of Object.keys(expanded)) {
            if (!expanded[rowId]) continue
            const node = byId.get(rowId)
            if (!node?.hasChildren || node.children || node.hasLoaded) continue
            pending = true
            const key = String(node.id)
            if (restoringIdsRef.current.has(key)) continue
            restoringIdsRef.current.add(key)
            Promise.resolve(fetchChildren(node.id)).finally(() => {
                restoringIdsRef.current.delete(key)
            })
        }
        if (!pending) restoreExpandedRef.current = false
    }, [data, expanded, reRenderSignal])

    useEffect(() => {
        setExpanded({});
    }, [filters, url]);
    
    return(
        <div className="h-full w-full overflow-hidden flex flex-col rounded-lg">
            <div className="flex-1 overflow-y-auto custom-scrollbar min-w-0 min-h-0">
                <table className="min-w-full border-separate border-spacing-0 table-fixed border border-[#E9ECEF] max-h-full" style={{ ...columnSizeVars, width: table.getTotalSize(), pointerEvents: disabled ? 'none' : 'auto'}}>
                    <thead className="sticky top-0 bg-gray-100 text-white z-10">
                    {table.getHeaderGroups().map(headerGroup => (
                            <tr key = {headerGroup.id}>
                                {headerGroup.headers.map(header => {
                                    // Двухуровневая шапка, как в BaseTable.
                                    const depth = header.depth - header.column.depth;
                                    // Нижний дубль одиночной колонки не рисуем: её заголовок уже растянут на оба ряда.
                                    if (depth > 1) {
                                        return null;
                                    }
                                    let rowSpan = 1;
                                    if (header.isPlaceholder) {
                                        rowSpan = 2;
                                    }
                                    const id = header.column.id.replace(/\./g, '-');
                                    return (
                                        <th 
                                        style={{
                                            verticalAlign: 'middle',
                                            width: `var(--col-${id}-size)`,
                                        }}
                                        key = {header.id}
                                        colSpan={header.colSpan}
                                        rowSpan={rowSpan}
                                        className="relative px-1 py-2 text-center shrink-0 overflow-hidden text-ellipsis bg-[#F0F4FF] text-[#364FC7] border border-t font-medium text-sm whitespace-pre-line break-words hyphens-auto">
                                        {header.column.getCanResize() && (
                                            <div
                                            onMouseDown={header.getResizeHandler()}
                                            onTouchStart={header.getResizeHandler()}
                                            className="absolute -right-[4px] top-0 h-full w-[8px] cursor-col-resize select-none touch-none z-10 bg-transparent"
                                            />
                                        )}    
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        {header.column.getCanFilter() ? (
                                            <div>
                                                <Filter column={header.column}/>
                                            </div>
                                        ) : null}
                                        </th>    
                                    )
                                })}
                            </tr>
                    ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {table.getRowModel().rows.map(row => {
                        const highlighted = row.getIsSelected() && selectionHighlight
                        return (
                        <tr key = {row.id} 
                        style={{
                            backgroundColor: highlighted
                                ? undefined
                                : getRowBackgroundColor?.(row.original),
                        }}
                        className={`hover:bg-[#E7F0FF] transition-colors duration-150 
                            ${highlighted
                            ? 'bg-[#D0EBFF] even:bg-[#D0EBFF] hover:bg-[#B1D7FF] shadow-[inset_3px_0_0_0_#364FC7]'
                            : 'bg-white even:bg-[#F8FAFF]'}
                        `}
                            onMouseDown={(e) => {
                            if (multiSelect && e.shiftKey) e.preventDefault()
                            }}
                            onClick={(e) => {
                            if (multiSelect) {
                                applyMultiSelect(e, row)
                                return
                            }
                            if (!row.getIsSelected()){
                                table.resetRowSelection();
                            }
                            row.toggleSelected(true);}}
                        >
                            {row.getVisibleCells().map(cell => { 
                                const id = cell.column.id.replace(/\./g, '-');
                                return (
                                    <td key = {cell.id} 
                                    style={{
                                        width: `var(--col-${id}-size)`,
                                    }}
                                        onClick={() => handleRowClick(row, cell)}
                                        className="px-4 py-2 border text-sm text-gray-800 text-left whitespace-normal overflow-hidden text-ellipsis"
                                    >
                                        <div>{flexRender(cell.column.columnDef.cell, cell.getContext())} </div>
                                    </td>
                                )
                            })}
                        </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    </div>
    );
};

function originalRowId(table, rowId) {
    try {
        return table.getRow(rowId).original.id
    } catch {
        return rowId
    }
}

function Filter({ column }) {
    const [isPending, startTransition] = useTransition();
    const {filterVariant}  = column.columnDef.meta ?? {}
  
    const columnFilterValue = column.getFilterValue()
    const handleFilterChange = (value: any) => {
        startTransition(() => {
            column.setFilterValue(value);
        });
    };

    return filterVariant === FILTER_TYPES.SELECT ? (
        <DynamicSelect
            contentApi={column.columnDef.meta?.content}
            value={columnFilterValue?.toString()}
            onChange={(value) => handleFilterChange(value)}
            params={ column.columnDef.meta?.params }
            size={"small"}
        />
    ) : filterVariant === FILTER_TYPES.DATE ? (
        <DynamicDatePicker 
            value={columnFilterValue}
            onChange={(value) => handleFilterChange(value)}
            views={['day', 'year', 'month']}
            format="dd.MM.yyyy" 
            isButtonHide={true}
            isClearable={true}
            size={"small"}
        />
    ) : (
        <DebouncedInput
            value={(columnFilterValue ?? '') as string}
            onChange={(value) => handleFilterChange(value)}
            allowClear={true}
            size={"small"}
        />
    )
}
