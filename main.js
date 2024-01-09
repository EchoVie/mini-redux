function validateFunction(val, type) {
  if (typeof val !== 'function') {
    throw new Error(`${type} 必须为函数`)
  }
}

const isObject = (val) => typeof val === 'object' && val !== null;

const isNil = (val) => typeof val === 'undefined' || typeof val === null;

function compose(...funcs) {
  return function (oldDispatch) {
    return funcs.reduceRight((dispatch, func) => func(dispatch), oldDispatch);
  }
}

export function createStore(reducer, initialState, enhancer) {
  let currentState = initialState;
  const currentListeners = [];

  validateFunction(reducer, 'reducer')

  if (!isNil(enhancer)) {
    validateFunction(enhancer, 'enhancer')

    return enhancer(createStore)(reducer, currentState);
  }

  function dispatch(action) {
    if (!isObject(action)) {
      throw new Error('action 必须是一个对象')
    }

    if (isNil(action.type)) {
      throw new Error('action对象中必须有type属性')
    }

    // 获取新值
    currentState = reducer(currentState, action);

    // 触发发布订阅中的发布
    currentListeners.forEach(listener => {
      listener();
    })
  }

  function subscribe(listener) {
    currentListeners.push(listener);
  }

  function getState() {
    return currentState;
  }

  return {
    dispatch,
    subscribe,
    getState
  }
}

export function combineReducers(reducers) {
  // 判断 reduce 是否为函数
  var reducerKeys = Object.keys(reducers);
  for (let i = 0; i < reducerKeys.length; i++) {
    validateFunction(reducers[reducerKeys[i]])
  }

  return function (state, action) {
    const nextState = {};

    for (let i = 0; i < reducerKeys.length; i++) {
      var key = reducerKeys[i];
      const reducer = reducers[key];
      const prevState = state[key];
      nextState[key] = reducer(prevState, action)
    }

    return nextState;
  }
}

export function bindActionCreators(actions, dispatch) {
  const result = {};
  Object.keys(actions).forEach((key) => {
    result[key] = () => {
      dispatch(actions[key]())
    }
  })

  return result;
}

export function applyMiddleware(...middlewares) {
  return function enhancer(createStore) {
    return function newCreateStore(reducer, initialState) {
      // 创建 store
      const store = createStore(reducer, initialState);

      // 阉割版的 store
      const middlewareAPI = {
        getState: store.getState,
        dispatch: store.dispatch
      }

      const chains = middlewares.map(middleware => middleware(middlewareAPI));

      // 传入旧 dispatch 获取新 dispatch
      const dispatch = compose(...chains)(store.dispatch);

      return {
        ...store,
        dispatch
      }
    }
  }
}
