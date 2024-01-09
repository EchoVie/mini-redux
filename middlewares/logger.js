export default function logger(store) {
  return function (next) {
    return function (action) {
      console.group(action.type);
      console.log('action', action)
      next(action)
      console.log('new state', store.getState())
      console.groupEnd();
    }
  }
} 