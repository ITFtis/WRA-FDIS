using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SGDS.Controllers.Api
{
    public class CctvController : ApiController
    {
        /// <summary>
        /// 取指定url資料
        /// </summary>
        /// <param name="url">服務api url</param>
        /// <returns></returns>
        [Route("api/getjson")]
        [HttpGet]
        public JToken GetJToken(string url)
        {
            var result = DouHelper.Misc.GetCache<JToken>(2 * 1000, url);
            if (result == null)
            {
                var o = DouHelper.HClient.Get<JToken>(url);//.Result.Message;
                result = o.Result.Result;
                DouHelper.Misc.AddCache(result, url);
                //Debug.WriteLine($"{url} count {(result == null ? 0 : result.Count())}");
            }

            return result;
        }
        /// <summary>
        /// 取水情影像雲端平台資料
        /// </summary>
        /// <param name="url">https://fmg.wra.gov.tw/swagger/api/XXXXX，XXXX部分相對路徑，或絕對路徑</param>
        /// <returns></returns>
        [Route("api/fmg/get/url")]
        [HttpGet]
        public JToken GetFmgCctv(string url)
        {
            if(!url.StartsWith("http"))
                url = GetFmgUrlBase() + url;
            if (url.IndexOf("token=") < 0)
            {
                url += (url.IndexOf("?") < 0 ? "?" : "&") + "token=eXysP97yhN";// &sourceid='1'";
            }
            return GetJToken(url);
        }
        /// <summary>
        /// fmg資料來源
        /// </summary>
        /// <param name="apiurlbase"></param>
        /// <returns></returns>
        [Route("api/fmg/get/source")]
        [HttpGet]
        public JArray GetFmgSource(string apiurlbase = "")
        {
            var urlbase = GetFmgUrlBase(apiurlbase);

            string key = "GetFmgSource" + urlbase;
            JArray sources = DouHelper.Misc.GetCache<JArray>(10 * 60 * 1000, key);
            if (sources == null)
            {
                sources = GetFmgCctv(urlbase + "source").Value<JArray>("cctvSource");
                DouHelper.Misc.AddCache(sources, key);
            }
            return sources;

        }

        static object GetFmgAllCctvStationLocker = new object();
        /// <summary>
        /// 取fmg所有cctv基本資料
        /// </summary>
        /// <param name="apiurlbase"></param>
        /// <returns></returns>
        [Route("api/fmg/get/allbase")]
        [Route("api/fmg/get/allbase/{apiurlbase}")]
        public List<JToken> GetFmgAllCctvStation(string apiurlbase = "", int c = 0)
        {
            var st = DateTime.Now;
            var urlbase = GetFmgUrlBase(apiurlbase);

            string key = "GetFmgAllCctvStation" + urlbase;
            lock (GetFmgAllCctvStationLocker)
            {
                List<JToken> allJtoken = DouHelper.Misc.GetCache<List<JToken>>(60 * 60 * 1000, key);
                try
                {
                    if (allJtoken == null)
                    {
                        allJtoken = new List<JToken>(8000);
                        var ss = GetFmgSource(apiurlbase);
                        var i = 0;

                        var hasErr = false;
                        ss.AsParallel().ForAll(s =>
                        {
                            var sid = s.Value<string>("sourceid");
                            System.Diagnostics.Debug.Write(s.Value<string>("name") + "...");

                            var u = urlbase + $"cctv_station?counid=2&sourceid={sid}";
                            JArray stas = DouHelper.Misc.GetCache<JArray>(60 * 60 * 1000, u); //先從cache中抓(前次有可能成功或失敗)
                            if (stas == null)
                            {

                                System.Diagnostics.Debug.WriteLine($"{s.Value<string>("name")} 抓Fmg資料");
                                var rtemp = GetFmgCctv(urlbase + $"cctv_station?sourceid={sid}");

                                if (rtemp != null)
                                {
                                    stas = rtemp.Value<JArray>("cctvs");

                                    foreach (var j in stas)
                                    {
                                        j["sourceid"] = sid; //增加查詢方便
                                    }
                                }
                                if (stas != null && stas.Count > 0)
                                {
                                    DouHelper.Misc.AddCache(stas, u);//成功加入cache
                                }
                            }
                            if (stas != null && stas.Count > 0) //cache有資料，或重抓成功，加入allJtoken
                            {
                                allJtoken.AddRange(stas);
                                System.Diagnostics.Debug.WriteLine($"{s.Value<string>("name")}完成 數量{stas.Count}站 {++i}/{ss.Count}");
                            }
                            else
                            {
                                hasErr = true;
                                System.Diagnostics.Debug.WriteLine($"{s.Value<string>("name")}錯誤!!!! {++i}/{ss.Count}");
                            }
                        });
                        if (!hasErr) //全部成功，才加入allJtoken cache
                            DouHelper.Misc.AddCache(allJtoken, key);
                    }
                }
                catch (Exception ex)
                {
                    if (c <= 2)
                        return GetFmgAllCctvStation(apiurlbase, ++c);
                }
                return allJtoken;
            }
        }
        /// <summary>
        /// 一條件取cctv站的即時影像
        /// </summary>
        /// <param name="id"></param>
        /// <param name="sourceid"></param>
        /// <param name="apiurlbase"></param>
        /// <returns></returns>
        [Route("api/fmg/get/cctv/{id}/{sourceid}")]
        [Route("api/fmg/get/cctv/{id}/{sourceid}/{apiurlbase}")]
        public JToken GetFmgCctvCameras(string id,string sourceid, string apiurlbase = "")
        {
            var urlbase = GetFmgUrlBase(apiurlbase);
            string key = "GetFmgCctvCameras" +id+ urlbase+apiurlbase;
            JToken jk = DouHelper.Misc.GetCache<JToken>(5 * 1000, key);
            if (jk == null)
            {
                jk = GetFmgCctv(urlbase + $"cctv/{id}?sourceid={sourceid}").Value<JArray>("cctvs").FirstOrDefault();
                if(jk!= null)
                    DouHelper.Misc.AddCache(jk, key);
            }
            return jk;
        }
        string GetFmgUrlBase(string inApibase = null)
        {
            var r = Startup.AppSet.WraFmgApiUrl; ;
            if (!string.IsNullOrEmpty(inApibase))
            {
                if (inApibase.StartsWith("http"))
                    r = inApibase;
                else if ("fmg".Equals(inApibase) || "fmgb".Equals(inApibase))
                    r = r.Replace("fmg", inApibase);
            }

            //if (string.IsNullOrEmpty(inApibase) || !inApibase.StartsWith("http"))
            //    r= "https://fmg.wra.gov.tw/swagger/api/";
            //else if ("fmg".Equals(inApibase) || "fmgb".Equals(inApibase))
            //    r= r.Replace("fmg", inApibase);
            //else r= inApibase;
            return r;
        }
    }
}