/**
 * Колонки master-detail «Ответственные лица».
 * Левая таблица: people; правая: karjera (пути/даты как в Delphi formUsersDoljn).
 */

/** Люди: код / ФИО / логин — BaseTable выбирает по row.original.id (= people.id). */
export const peopleColumns = [
  {
    accessorKey: 'id',
    header: 'Код',
    size: 80,
  },
  {
    accessorKey: 'fio',
    header: 'ФИО',
    size: 220,
  },
  {
    accessorKey: 'oraName',
    header: 'Логин',
    size: 140,
  },
]

/** Карьеры выбранного человека: даты, должность, отдел (полный путь). */
export const careerColumns = [
  {
    accessorKey: 'dtEnter',
    header: 'Дата начала работы',
    size: 140,
  },
  {
    accessorKey: 'dtOut',
    header: 'Дата окончания работы',
    size: 150,
  },
  {
    accessorKey: 'doljNm',
    header: 'Должность',
    size: 180,
  },
  {
    accessorKey: 'orgNm',
    header: 'Отдел',
    size: 260,
  },
]
