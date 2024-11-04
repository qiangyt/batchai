import { SessionState } from '@/lib';
import { UIContextType } from '@/lib/ui.context';
import axios from 'axios'


const useAxios = (s:SessionState, ui: UIContextType) => {
  const service = axios.create({
    //baseURL: `${process.env.NEXT_PUBLIC_API_SERVER}/rest/v1`,
    baseURL: `/rest/v1`,
    timeout: 2 * 1000,
    responseType: 'json',
    maxContentLength: 1024 * 1024,
    maxRedirects: 0,
    withCredentials: true
  })

  service.interceptors.request.use(
    (config) => {
      // Do something before request is sent
      config.headers['Content-Type'] = 'application/json'

      const accessToken = s?.detail?.accessToken;
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`
      }

      return config
    },
    (error) => {
      // Do something with request error
      //ui.setError(error)
      Promise.reject(error)
    }
  )

  service.interceptors.response.use(
    (response) => {
      return response.data
    },
    (error) => {
      const errResp = error.response;
      if (errResp && errResp.status === 401) {
        //if (errResp.config.url.endsWith('/rest/signin')) {
        //  console.log('用户名或密码有误')//TODO: ElMessage.error('用户名或密码有误')
        //} else {
        //  console.log('请登录')//ElMessage.error('请登录')
        //}
        // 重定向到登录页面
        //const router = useRouter()
        //router.push({ name: 'SignIn' })
        s.redirect();
        return Promise.resolve(null);
      }// else {
        //ui.setError(error);
      //}
      return Promise.reject(error)
    }
  )

  return service;
};

export default useAxios;