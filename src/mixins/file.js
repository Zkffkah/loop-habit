const { ipcRenderer } = require('electron')

export default {
  data() {
    return {
      habitContent: null,
      content: null,
      rating: null
    }
  },
  methods: {
    saveFile() {
      ipcRenderer.invoke('save-file', [
        this.formatDate('y'),
        this.today,
        this.content,
        this.rating
      ])
    },
    loadFile() {
      ipcRenderer.invoke('load-file', [
        this.formatDate('y'),
        this.today
      ]).then(data => {
        this.content = data.content
        this.rating = data.rating
      })
    },
    saveHabitFile() {
      ipcRenderer.invoke('save-file', [
        this.formatDate('y'),
        this.formatDate('y'),
        this.habitContent
      ])
    },
    loadHabitFile() {
      ipcRenderer.invoke('load-file', [
        this.formatDate('y'),
        this.formatDate('y')
      ]).then(data => {
        this.habitContent = data.content
      })
    },
    debounce(func, wait) {
      let timeout;

      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      }
    }
  },
  created() {
    // this.loadFile()
    this.loadHabitFile()
  }
}