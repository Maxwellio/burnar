import type { ColumnDef, SortingState, VisibilityState } from "@tanstack/react-table";
import { flexRender, getCoreRowModel, getFacetedMinMaxValues, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, TableOptions, useReactTable } from "@tanstack/react-table";
import React, { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { DebouncedInput, DynamicDatePicker, DynamicSelect } from "../Input/InputComponents";
import { FILTER_TYPES } from "../utils/types";
import { useFetchData } from "./hooks/useFetchData";

export interface ColumnFilter<TData>{
    id: string
    value: unknown
}
 
interface BaseTableProps<TData> extends Partial<TableOptions<TData>>{
    url: string;
    columns: ColumnDef<TData>[];
    filters?: ColumnFilter<TData>[];
    setFilters?: any;
    defColumnFilters?: any;
    defColumnVisibility?: VisibilityState;
    setSelectedId?: any;
    setSelectedCol?: any;
    handleDoubleClick?: any;
    pageable?: boolean;
    reRenderSignal?: number; 
    disabled?: boolean;
    org? 
    /** Фон строки. Заданный цвет перекрывает зебру, синее выделение и hover. */
    getRowBackgroundColor?: (row: TData) => string | undefined;
}

export const BaseTable = <TData,>({url, columns, filters, setFilters, defColumnFilters, defColumnVisibility, setSelectedId, handleDoubleClick, setSelectedCol, pageable=false, disabled=false, reRenderSignal, org, getRowBackgroundColor, ...props}: BaseTableProps<TData>) =>{
    const [sorting, setSorting] = useState<SortingState>([]);
    const {data, total, loading, pagination, hasMore, totalElements, setPagination, setData} = useFetchData<TData>(url, filters || [], pageable, reRenderSignal);
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(defColumnVisibility || {})
    const [activeGroup, setActiveGroup] = useState(null);
    const observerTarget = useRef<HTMLDivElement>()
    const [columnSizing, setColumnSizing] = useState(() => {
        const saved = localStorage.getItem(`table-column-sizing:${url}`);
        return saved ? JSON.parse(saved) : {};
    });
    const table = useReactTable({
        data,
        columns,
        pageCount : total,
        state: {
            sorting,
            pagination : {
                pageIndex : pagination.pageIndex,
                pageSize : pagination.pageSize
            },
            columnFilters : filters,
            columnVisibility,
            rowSelection,
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
        enableRowSelection: true,
        enableMultiRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setFilters,
        getSortedRowModel: getSortedRowModel(),
        onColumnSizingChange: setColumnSizing,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onPaginationChange: setPagination,
        onColumnVisibilityChange: setColumnVisibility,
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        columnResizeMode: 'onChange',
        enableColumnResizing: true,
        autoResetPageIndex: false,
        manualPagination: true,
        manualFiltering: true,
        ...props,
    });
    const tableContainerRef = useRef<HTMLDivElement>(null);
    
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
            if(setSelectedId){
                setSelectedId(row.original.id);
            }
            if(setSelectedCol){
               setSelectedCol(cell.column.id);
            }
        }
    };

    // сохраниение размера колонок
    useEffect(() => {
        localStorage.setItem(`table-column-sizing:${url}`, JSON.stringify(columnSizing));
    }, [columnSizing]);

    // обсервер для автоматической пагинации при достяжении конца таблицы
    useEffect(() => {
        if (loading) return;
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && table.getCanNextPage()){
                    table.nextPage();
                }
            },
            {threshold: 1.0}
        )
        if (observerTarget.current){
            observer.observe(observerTarget.current)
        }
        return () => {
            if (observerTarget.current){
                observer.unobserve(observerTarget.current)
            }
        }
    }, [loading]) 

    return(
        <div {...props} className="h-full flex flex-col bg-white rounded-xl shadow-lg border">
            <div className="h-full w-full overflow-hidden flex flex-col ">
                <div  ref={tableContainerRef} className="flex-1 overflow-y-auto custom-scrollbar min-w-0 min-h-0">
                    <table className="min-w-full border-separate border-spacing-0 table-fixed border border-[#E9ECEF] max-h-full" style={{ ...columnSizeVars, width: table.getTotalSize(), pointerEvents: disabled ? 'none' : 'auto'}}>
                        <thead className="sticky top-0 bg-gray-100 text-white z-10">
                            {table.getHeaderGroups().map(headerGroup => (
                                    <tr key = {headerGroup.id}> 
                                        {headerGroup.headers.map(header => {
                                            // Отрисовка многоуровневой шапки таблицы
                                            const depth = header.depth - header.column.depth;
                                            // Если заголовок находится слишком глубоко (уровень вложенности больше 1), мы его пропускаем (возвращаем null), чтобы избежать дублирования или поломки верстки
                                            if (depth > 1) {
                                                return (null);
                                            }
                                            let rowSpan = 1;
                                            // Если текущий заголовок является фиктивной ячейкой для выравнивания, то заставляем её растянуться на 2 строки
                                            if (header.isPlaceholder){
                                                rowSpan = 2;
                                            }
                                            // Выделение группы и родителя если нажат любой элемент группы 
                                            const isHighlighted = activeGroup === header.column.columnDef.header || activeGroup === header.column.parent?.columnDef.header;
                                            const currentBgColor = isHighlighted ? '#BCD4FF' : '#F0F4FF';
                                            // 'orgId.id' превратится в 'orgId-id', чтобы точки не ломали CSS-селекторы.
                                            const id = header.column.id.replace(/\./g, '-');
                                            return(
                                                <th 
                                                    key = {header.id}
                                                    colSpan={header.colSpan}
                                                    rowSpan={rowSpan}
                                                    style={{
                                                        verticalAlign: 'middle',
                                                        backgroundColor: currentBgColor,
                                                        width: `var(--col-${id}-size)`,
                                                    }}
                                                    className="relative px-1 py-2 text-center shrink-0 overflow-hidden text-ellipsis bg-[#F0F4FF] text-[#364FC7] border border-t font-medium text-sm whitespace-pre-line break-words hyphens-auto"
                                                >
                                                    {header.column.getCanResize() && (
                                                        <div
                                                        onMouseDown={header.getResizeHandler()}
                                                        onTouchStart={header.getResizeHandler()}
                                                        className="absolute -right-[4px] top-0 h-full w-[8px] cursor-col-resize select-none touch-none z-10 bg-transparent"
                                                        />
                                                    )}
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                    {{ asc: '↑',
                                                    desc: '↓',
                                                    }
                                                    [header.column.getIsSorted() as string] ?? null}
                                                    {header.column.getCanFilter() ? (
                                                        <div>
                                                            <Filter column={header.column} org={org}/>
                                                        </div>
                                                    ) : null}

                                                </th> 
                                            );
                                        })}
                                    </tr>
                            ))}
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {table.getRowModel().rows.map(row =>{
                                const rowColor = getRowBackgroundColor?.(row.original)
                                return (
                                <tr key = {row.id}
                                    style={rowColor ? { backgroundColor: rowColor } : undefined}
                                    onClick={(e) => {
                                    // Проверяем нажата ли клавиша Ctrl
                                    const isCtrlPressed = e.ctrlKey;
                                    if (!isCtrlPressed) {
                                        if (!row.getIsSelected()){
                                            table.resetRowSelection();
                                        }
                                        row.toggleSelected(true);
                                    } else {
                                        row.toggleSelected();
                                    }}}
                                    className={`hover:bg-[#E7F0FF] transition-colors duration-150 
                                                ${row.getIsSelected()
                                                ? 'bg-[#D0EBFF] even:bg-[#D0EBFF] hover:bg-[#B1D7FF] shadow-[inset_3px_0_0_0_#364FC7]'
                                                : 'bg-white even:bg-[#F8FAFF]'}
                                            `}
                                    //@ts-expect-error
                                    onDoubleClick={() => { if (handleDoubleClick) handleDoubleClick(table.getRow(row.id).original.id)}}
                                >
                                    {row.getVisibleCells().map(cell => {
                                        // 'orgId.id' превратится в 'orgId-id', чтобы точки не ломали CSS-селекторы.
                                        const id = cell.column.id.replace(/\./g, '-');
                                        return(                                    
                                            <td key = {cell.id}
                                                style={{    
                                                    width: `var(--col-${id}-size)`,
                                                }}
                                                //@ts-expect-error
                                                onClick={() => {handleRowClick(row, cell), setActiveGroup(cell.column.parent?.columnDef.header || null)}}
                                                className="relative px-1 py-1 text-left whitespace-normal overflow-hidden text-ellipsis text-gray-800 border first-letter border-t  text-sm w-0 shrink-0"
                                            >
                                                <div className="">{flexRender(cell.column.columnDef.cell, cell.getContext())} </div>
                                            </td>
                                        )
                                    })}
                                </tr>
                                )
                            })}
                            {hasMore && (<tr 
                                //@ts-ignore
                                ref={observerTarget}>
                            </tr>)}
                        </tbody>
                        {pageable && 
                            <tfoot>
                                <tr className="sticky bottom-0 bg-gray-100 isolate border-t border-gray-300 max-h-10 border-separate border-spacing-0">
                                    <td className="font-semibold text-[#364FC7] whitespace-nowrap">Количество записей: {totalElements}</td>
                                    <td colSpan={table.getVisibleLeafColumns().length-1} className=""></td>
                                </tr>
                            </tfoot>
                        }

                    </table>
                </div>
            </div>  
        </div>
    );
};

function Filter({ column, org, }) {
    const [isPending, startTransition] = useTransition();
    const {filterVariant}  = column.columnDef.meta ?? {}
  
    const columnFilterValue = column.getFilterValue()
    const handleTextFilterChange = (value: any) => {
        column.setFilterValue(value);
    };
    const handleSelectFilterChange = (value: any) => {
        startTransition(() => {
            column.setFilterValue(value);
        });
    };

    return filterVariant === FILTER_TYPES.SELECT ? (
        <DynamicSelect
            contentApi={column.columnDef.meta?.content}
            value={columnFilterValue?.toString()}
            onChange={(value) => handleSelectFilterChange(value)}
            params={ column.columnDef.meta?.params ? {org} : '' }
            size={"small"}
        />
    ) : filterVariant === FILTER_TYPES.DATE ? (
        <DynamicDatePicker
            value={columnFilterValue}
            onChange={(value) => handleSelectFilterChange(value)}
            views={['day', 'year', 'month']}
            format="dd.MM.yyyy" 
            isButtonHide={true}
            isClearable={true}
            size={"small"}
        />
    ) : (
        <DebouncedInput
            value={(columnFilterValue ?? '') as string}
            onChange={(value) => handleTextFilterChange(value)}
            allowClear={true}
            size={"small"}
        />
    )
  }
