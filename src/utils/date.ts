import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

// 配置dayjs
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

/**
 * 格式化日期时间
 * @param date 日期字符串或Date对象
 * @param format 格式模板，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串
 */
export function formatDateTime(date: string | Date | null | undefined, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!date) return '未知'
  return dayjs(date).format(format)
}

/**
 * 格式化日期
 * @param date 日期字符串或Date对象
 * @returns 格式化后的日期字符串 (YYYY-MM-DD)
 */
export function formatDate(date: string | Date | null | undefined): string {
  return formatDateTime(date, 'YYYY-MM-DD')
}

/**
 * 格式化时间
 * @param date 日期字符串或Date对象
 * @returns 格式化后的时间字符串 (HH:mm:ss)
 */
export function formatTime(date: string | Date | null | undefined): string {
  return formatDateTime(date, 'HH:mm:ss')
}

/**
 * 格式化相对时间
 * @param date 日期字符串或Date对象
 * @returns 相对时间字符串，如 "2分钟前"
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '未知'
  return dayjs(date).fromNow()
}

/**
 * 格式化时长（毫秒）
 * @param ms 毫秒数
 * @returns 格式化后的时长字符串
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  } else if (ms < 60000) {
    return `${Math.round(ms / 1000)}s`
  } else if (ms < 3600000) {
    return `${Math.round(ms / 60000)}min`
  } else {
    return `${Math.round(ms / 3600000)}h`
  }
}

/**
 * 检查日期是否是今天
 * @param date 日期字符串或Date对象
 * @returns 是否是今天
 */
export function isToday(date: string | Date): boolean {
  return dayjs(date).isSame(dayjs(), 'day')
}

/**
 * 检查日期是否是昨天
 * @param date 日期字符串或Date对象
 * @returns 是否是昨天
 */
export function isYesterday(date: string | Date): boolean {
  return dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day')
}

/**
 * 获取日期范围
 * @param days 天数，默认7天
 * @returns [开始日期, 结束日期]
 */
export function getDateRange(days: number = 7): [string, string] {
  const end = dayjs().format('YYYY-MM-DD')
  const start = dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD')
  return [start, end]
}

/**
 * 获取本周日期范围
 * @returns [周一, 周日]
 */
export function getThisWeekRange(): [string, string] {
  const start = dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD')
  const end = dayjs().endOf('week').add(1, 'day').format('YYYY-MM-DD')
  return [start, end]
}

/**
 * 获取本月日期范围
 * @returns [月初, 月末]
 */
export function getThisMonthRange(): [string, string] {
  const start = dayjs().startOf('month').format('YYYY-MM-DD')
  const end = dayjs().endOf('month').format('YYYY-MM-DD')
  return [start, end]
}