import { DateTime } from "luxon"

export default {
  data () {
    return {
      today: this.getToday()
    }
  },
  methods: {
    getToday() {
      return DateTime.now().toISODate()
    },
    /**
     * Set the current day by click.
     * @param {*} day
     * @returns
     */
    setDay(day) {
      this.today = DateTime.fromISO(day).toISODate()
    },
    /**
     * Takes in any integer and shifts the date by the value of the integer. Returns a normal date string.
     * @param {number} day
     * @param {string} date
     * @returns {string} date
     */
     shiftDay(day) {
      this.today = DateTime.fromISO(this.today).plus({days: day}).toISODate()
    },
    /**
     * Returns an array of date strings in YYYY-mm-dd for the current active week
     */
     getCurrentWeekDates() {
      let week = []
      const startOfWeek = DateTime.fromISO(this.today).startOf('week')

      // TODO get locale from state
      for (let i = 0; i <= 6; i++) {
        let day = startOfWeek.plus({days: i}).setLocale('zh-CN')
        week.push(
          {
            isoDate: day.toISODate(),
            day: day.toFormat('d'),
            weekDay: day.toFormat('ccccc'),
          }
        )
      }
      return week
    },
    getDateGoalStatus(date,habit){
       return habit.stats[date]
    },
    addHabitGroup(groupName, habitContent){
      habitContent.push({"groupName":groupName,"items":[]})
      this.saveHabitFile()
      this.loadHabitFile()
    },
    addHabit(habitName, habitGroup){
      habitGroup.items.push({"name":habitName,"stats":{}})
      this.saveHabitFile()
      this.loadHabitFile()
    },
    removeHabit(habitName, habitGroup){
      console.log("removeHabit " + habitName +"  "+ habitGroup)
      const index = habitGroup.items.findIndex(prop => prop.name === habitName)
      habitGroup.items.splice(index,1)
      this.saveHabitFile()
      this.loadHabitFile()
    },
    changeHabitName(newName, habit){
      habit.name = newName
      this.saveHabitFile()
      this.loadHabitFile()
    },
    removeGroup(groupName){
      console.log("removeGroup "+groupName)
      const index = this.habitContent.findIndex(prop => prop.groupName === groupName)
      this.habitContent.splice(index,1)
      this.saveHabitFile()
      this.loadHabitFile()
    },
    changeHabitGroupName(newName, habitGroup){
      console.log("changeHabitGroupName "+newName+habitGroup)
      habitGroup.groupName = newName
      this.saveHabitFile()
      this.loadHabitFile()
    },
    toggleDateGoalStatus(date,habit){
      if (habit.stats[date] == undefined) {
        habit.stats[date] = true
      } else if (habit.stats[date] === true) {
        habit.stats[date] = false
      } else if (habit.stats[date] === false) {
        habit.stats[date] = undefined
      }
      this.saveHabitFile()
      this.loadHabitFile()
    },
    /**
     * Format a date into any string.
     * @param {string} format
     * @returns {string}
     */
    formatDate(format) {
      return DateTime.fromISO(this.today).toFormat(format)
    },
  },
  watch: {
    today(newDate, oldDate) { //eslint-disable-line
      this.setDay(newDate)
      // this.loadFile()
    }
  }
}