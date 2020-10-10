import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { lighten, withStyles, makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import DeleteIcon from '@material-ui/icons/Delete';
import { orange } from '@material-ui/core/colors';


import { Data, EnhancedTableToolbarProps } from './CustomTypes';
import { rows } from './Form';
import { saveOnLocal, getDataFromLocal } from './StorageManagement';
import { IPriority } from './CustomTypes';
import { getKeyByValue } from './Utils';
import './styles/EnchancedTable.css';

const priority: IPriority = {
    'High': 2,
    'Medium': 1,
    'Low': 0,
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
}

type Order = 'asc' | 'desc';

function getComparator<Key extends keyof any>(
    order: Order,
    orderBy: Key,
): (a: { [key in Key]: number | string | boolean }, b: { [key in Key]: number | string | boolean }) => number {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
    const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
}

interface HeadCell {
    disablePadding: boolean;
    id: keyof Data;
    label: string;
    numeric: boolean;
}

const headCells: HeadCell[] = [
    { id: 'name', numeric: false, disablePadding: true, label: 'Task Name' },
    { id: 'priority', numeric: true, disablePadding: false, label: 'Priority' },
    { id: 'done', numeric: true, disablePadding: false, label: 'Done' },
];

interface EnhancedTableProps {
    classes: ReturnType<typeof useStyles>;
    numSelected: number;
    onRequestSort: (event: React.MouseEvent<unknown>, property: keyof Data) => void;
    order: Order;
    orderBy: string;
    rowCount: number;
}

const StyledTableCell = withStyles((theme: Theme) =>
    createStyles({
        root: {
            backgroundColor: '#595338',
            color: theme.palette.common.white,
            '&:hover': {
                color: theme.palette.common.white,
            },
        },
        head: {
            backgroundColor: '#595338',
            color: theme.palette.common.white,
        },
        body: {
            fontSize: 14,
        },
    }),
)(TableCell);

function EnhancedTableHead(props: EnhancedTableProps) {
    const { classes, order, orderBy, onRequestSort } = props;
    const createSortHandler = (property: keyof Data) => (event: React.MouseEvent<unknown>) => {
        onRequestSort(event, property);
    };

    return (
        <TableHead>
            <TableRow>
                {headCells.map((headCell) => (
                    <StyledTableCell
                        key={headCell.id}
                        align={headCell.numeric ? 'center' : 'left'}
                        padding='default'
                        sortDirection={orderBy === headCell.id ? order : false}
                    >
                        <TableSortLabel
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : 'asc'}
                            onClick={createSortHandler(headCell.id)}
                        >
                            {headCell.label}
                            {orderBy === headCell.id ? (
                                <span className={classes.visuallyHidden}>
                                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                </span>
                            ) : null}
                        </TableSortLabel>
                    </StyledTableCell>
                ))}
                {/* Placeholder space */}
                <StyledTableCell>
                </StyledTableCell>
            </TableRow>
        </TableHead >
    );
}

const useToolbarStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            paddingLeft: theme.spacing(2),
            paddingRight: theme.spacing(1),
        },
        highlight:
            theme.palette.type === 'light'
                ? {
                    color: theme.palette.secondary.main,
                    backgroundColor: lighten(theme.palette.secondary.light, 0.85),
                } : {
                    color: theme.palette.text.primary,
                    backgroundColor: theme.palette.secondary.dark,
                },
        title: {
            flex: '1 1 100%',
        },
    }),
);

const EnhancedTableToolbar = (props: EnhancedTableToolbarProps) => {
    const classes = useToolbarStyles();
    return (
        <Toolbar className={clsx(classes.root)}>
            <Typography className={classes.title} variant="h5" id="tableTitle" component="div">
                Epic Todo List
            </Typography>
        </Toolbar>
    );
};

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: '80%',
            marginLeft: 'auto',
            marginRight: 'auto',
        },
        paper: {
            width: '100%',
            marginBottom: theme.spacing(2),
        },
        table: {
            minWidth: 500,
        },
        visuallyHidden: {
            border: 0,
            clip: 'rect(0 0 0 0)',
            height: 1,
            margin: -1,
            overflow: 'hidden',
            padding: 0,
            position: 'absolute',
            top: 20,
            width: 1,
        },
    }),
);

declare module '@material-ui/core/styles/createMuiTheme' {
    interface Theme {
        status: {
            danger: string;
        };
    }
    // allow configuration using `createMuiTheme`
    interface ThemeOptions {
        status?: {
            danger?: string;
        };
    }
}

const useCheckboxStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            color: '#A9A9A9',
            '&$checked': {
                color: orange[500],
            },
        },
        checked: {},
    }),
);


export default function EnhancedTable() {
    const classes = useStyles();
    const checkBoxClasses = useCheckboxStyles();
    const [order, setOrder] = useState<Order>('asc');
    const [orderBy, setOrderBy] = useState<keyof Data>('priority');
    const [selected] = useState<string[]>([]);

    const [update, setUpdate] = useState<boolean>(false);
    const [dataRows, setData] = useState<Data[]>([]); //rows
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(5);
    const [showDelete, setShowDelete] = useState<string>('');

    useEffect(() => {
        let todos = getDataFromLocal();
        setData(todos);
    }, [])

    const handleRequestSort = (event: React.MouseEvent<unknown>, property: keyof Data) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const emptyRows = rowsPerPage - Math.min(rowsPerPage, rows.length - page * rowsPerPage);

    const getIndex = (value: string, data: Data[]): number => {
        let index: number = -1;
        data.forEach((row, idx) => {
            if (row.id === value) {
                index = idx;
            };
        });
        return index;
    }

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>, id: string) => {
        const selectedIndex = getIndex(id, dataRows);

        if (selectedIndex === 0) {
            dataRows[selectedIndex] = { ...dataRows[selectedIndex], [event.target.name]: event.target.checked }
            setData(dataRows)
        } else if (selectedIndex === selected.length - 1) {
            dataRows[selectedIndex] = { ...dataRows[selectedIndex], [event.target.name]: event.target.checked }
        } else if (selectedIndex > 0) {
            dataRows[selectedIndex] = { ...dataRows[selectedIndex], [event.target.name]: event.target.checked }
        }

        setUpdate(!update);
    };

    const removeRow = (id: string) => {
        const selectedIndex = getIndex(id, dataRows);
        let newDataRows: Data[] = [];

        if (selectedIndex === -1) {
            newDataRows = newDataRows.concat(dataRows, dataRows[selectedIndex]);
        } else if (selectedIndex === 0) {
            newDataRows = newDataRows.concat(dataRows.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newDataRows = newDataRows.concat(dataRows.slice(0, -1));
        } else if (selectedIndex > 0) {
            newDataRows = newDataRows.concat(
                dataRows.slice(0, selectedIndex),
                dataRows.slice(selectedIndex + 1),
            );
        }

        saveOnLocal(newDataRows);
        setData(newDataRows);
    }

    const onMouseEnter = (id: string): void => setShowDelete(id);
    const onMouseLeave = (): void => setShowDelete('');

    return (
        <div className={classes.root}>
            <Paper className={classes.paper}>

                <EnhancedTableToolbar numSelected={selected.length} />
                <TableContainer>
                    <Table
                        className={classes.table}
                        aria-labelledby="tableTitle"
                        aria-label="enhanced table"
                    >
                        <EnhancedTableHead
                            classes={classes}
                            numSelected={selected.length}
                            order={order}
                            orderBy={orderBy}
                            onRequestSort={handleRequestSort}
                            rowCount={dataRows.length}
                        />

                        <TableBody>
                            {stableSort(dataRows, getComparator(order, orderBy))
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row, index) => {

                                    const labelId = `enhanced-table-checkbox-${index}`;

                                    return (
                                        <TableRow
                                            hover
                                            onMouseEnter={() => onMouseEnter(row.id)}
                                            onMouseLeave={() => onMouseLeave()}
                                            tabIndex={-1}
                                            key={row.id}
                                        >
                                            <TableCell component="th" id={labelId} scope="row">
                                                {row.name}
                                            </TableCell>
                                            <TableCell align="center">{getKeyByValue(priority, row.priority)}</TableCell>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    name='done'
                                                    classes={{
                                                        root: checkBoxClasses.root,
                                                        checked: checkBoxClasses.checked,
                                                    }}
                                                    onChange={(event) => handleChange(event, row.id)}
                                                    checked={row.done}
                                                    inputProps={{ 'aria-labelledby': labelId }}
                                                />
                                            </TableCell>
                                            <TableCell
                                                padding='none'
                                                size='small'>
                                                <span
                                                    className={showDelete === row.id ? 'buttonVisible' : 'buttonHidden'}
                                                    onClick={() => removeRow(row.id)}
                                                >
                                                    <Tooltip title="Delete">
                                                        <IconButton className={'deleteButon'} aria-label="Delete">
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            {emptyRows > 0 && (
                                <TableRow style={{ height: 53 * emptyRows }}>
                                    <TableCell colSpan={6} />
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 15]}
                    component="div"
                    count={dataRows.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onChangePage={handleChangePage}
                    onChangeRowsPerPage={handleChangeRowsPerPage}
                />
            </Paper>
        </div >
    );
}
