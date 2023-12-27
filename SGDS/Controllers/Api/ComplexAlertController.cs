using Dou.Models;
using IotApi;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Web.Http;
using System.Web.Http.Description;
using System.Web.Http.Results;
using System.Xml;

namespace SGDS.Controllers.Api
{
    public class ComplexAlertController : ApiController
    {

        //static string WraFhyUrl = "https://fhy.wra.gov.tw/api/v2/";
        //static string PTWaterUrl = "http://www.acems.tw/API/LastData/GetLastDataByCaseNumber/8357404D-6852-4C56-BD5C-FD3A09573675/true";
        //static string TYWaterYrl= "https://winfo.tycg.gov.tw/Transfer/UploadFile/WATERLEVEL.xml";

        public ComplexAlertController()
        {

        }

        static object lockLastAlert = new object();
        static int longCacheInterval = 6 * 60 * 1000;
        static int shortCacheInterval = 3 * 60 * 1000;
        static int cacheAlertInterval = longCacheInterval;
        static DateTime lastRainDatetime = DateTime.MinValue;

        static List<CAlertData> CacheLastAlert;
        #region complex Api
        /// <summary>
        /// 最新複合淹水警戒-僅有警戒資料
        /// </summary>
        /// <returns>IEnumerable<CAlertData></returns>
        [Route("api/alert/complex/rt")]
        [ResponseType(typeof(IEnumerable<CAlertData>))]
        [HttpGet]
        public IEnumerable<CAlertData> LastAlert()
        {
            return LastAllAlert().Where(s => (s.Alert != null && s.Alert.Value));
        }
        /// <summary>
        /// 最新複合淹水警戒-因缺資料或參數有問題資料
        /// </summary>
        /// <returns></returns>
        [Route("api/alert/complex/rt/err")]
        [ResponseType(typeof(IEnumerable<CAlertData>))]
        [HttpGet]
        public IEnumerable<CAlertData> LastErrAlert()
        {
            return LastAllAlert().Where(s => s.Alert == null);
        }
        /// <summary>
        /// 最新複合淹水警戒-含有警戒、無警戒資料
        /// </summary>
        /// <returns></returns>
        [Route("api/alert/complex/rt/all")]
        [ResponseType(typeof(IEnumerable<CAlertData>))]
        [HttpGet]
        public List<CAlertData> LastAllAlert()
        {
            List<CAlertData> r = CacheLastAlert;
            if (r == null) //讀檔案
            {
                r = GetLastAlertFileData();
            }
            return r;
        }
        /// <summary>
        /// 最新複合淹水警戒-依自訂1小時(H1)延時雨量值
        /// </summary>
        /// <param name="h1">1小時(H1)延時雨量值</param>
        /// <returns></returns>
        [Route("api/alert/complex/rt/H1/{h1}")]
        [ResponseType(typeof(IEnumerable<CAlertData>))]
        [HttpGet]
        public IEnumerable<CAlertData> CalAlertAdjustH1(double h1)
        {
            return CalAlert(h1).Where(s => s.Alert != null && s.Alert.Value);
        }

        /// <summary>
        /// 依時間取，取複合淹水警戒
        /// </summary>
        /// <param name="dt">yyyyMMddHHmm</param>
        /// <returns></returns>
        //[Route("api/alert/complex/{dt}")]
        //[Route("api/alert/complex/{dt}/{alert}")]
        [Route("api/alert/complex/{dt}/{alert?}")]   //api/alert/complex/202307271800/null
        [ResponseType(typeof(IEnumerable<CAlertData>))]
        [HttpGet]
        public IEnumerable<CAlertData> GetCalAlertByTime(string dt, bool? alert = null)
        {
            if (string.IsNullOrEmpty(dt) || dt.Length != 12)
                throw new Exception("日期參數格式有誤!!");
            dt = dt.Substring(0, 11) + "0";
            DateTime qtime = DateTime.ParseExact(dt, "yyyyMMddHHmm", CultureInfo.InvariantCulture);
            string key = "GetCalAlertByTime" + qtime;
            IEnumerable<CAlertData> r = DouHelper.Misc.GetCache<IEnumerable<CAlertData>>(60 * 1000, key);
            if (r == null)
            {
                var path = System.Web.Hosting.HostingEnvironment.MapPath($"~/Data/Alert/{qtime.ToString("yyyy/MM/dd")}");

                string cachef = System.IO.Path.Combine(path, $"{qtime.ToString("yyyyMMddHHmm")}.json");
                if (File.Exists(cachef))
                {
                    r = DouHelper.Misc.DeSerializeObjectLoadJsonFile<IEnumerable<CAlertData>>(cachef);// ializeObjectSaveJsonFile(r, cachef); DouHelper.Misc.DeSerialize<List<CAlertData>>(cachef);
                    DouHelper.Misc.AddCache(r, key);
                }

            }
            if (alert!=null)
                return r.Where(s => s.Alert == alert);
            else
                return r;
        }
        #endregion

        List<CAlertData> GetLastAlertFileData()
        {
            DateTime n = DateTime.Now;
            n = Convert.ToDateTime(n.ToString("yyyy/MM/dd HH:mm").Substring(0, 15) + "0:00");
            List<CAlertData> result = null;
            while (result == null)
            {
                var path = System.Web.Hosting.HostingEnvironment.MapPath($"~/Data/Alert/{n.ToString("yyyy/MM/dd")}");
                if (!Directory.Exists(path))
                    Directory.CreateDirectory(path);
                string cachef = System.IO.Path.Combine(path, $"{n.ToString("yyyyMMddHHmm")}.json");
                if (File.Exists(cachef))
                {
                    CacheLastAlert = result = DouHelper.Misc.DeSerializeObjectLoadJsonFile<List<CAlertData>>(cachef);// ializeObjectSaveJsonFile(r, cachef); DouHelper.Misc.DeSerialize<List<CAlertData>>(cachef);
                }
                n = n.AddMinutes(-10);
                if (result != null && (DateTime.Now - n).TotalHours > 3)
                    break;
            }
            return result;
        }

        /// <summary>
        /// 複合淹水計算
        /// </summary>
        /// <param name="rh1ajust">可給H1值，測試用</param>
        /// <returns> List<CAlertData></returns>
        internal List<CAlertData> CalAlert(double? rh1ajust = null)
        {
            List<CAlertData> r = new List<CAlertData>();
            lock (lockLastAlert)
            {

                var rainrts = GetRainRt();
                var fhywaters = GetFhyWaterRt();
                var ptwaters = GetPTWaterRt();
                var tywaters = GetTaoyuanWater();
                if (rainrts == null)
                    Logger.Log.For(this).Info("fhy即時雨量是null");
                if(fhywaters==null)
                    Logger.Log.For(this).Info("fhy即時水位是null");
                if(ptwaters==null)
                    Logger.Log.For(this).Info("即時屏東水位是null");
                if(tywaters == null)
                    Logger.Log.For(this).Info("即時桃園水位是null");
                var datadt = rainrts.First().Value<DateTime>("Time");
                foreach (var p in AlertParas)
                {
                    
                    CAlertData cad = new CAlertData { Name = p.SubDistrict, County = p.County, District = p.District, RainNo = p.RainNo, WaterNo = p.WaterNo };
                    r.Add(cad);
                    var rjt = rainrts.FirstOrDefault(s => s.Value<string>("StationNo") == cad.RainNo); //雨量資料
                   
                    if (rjt == null)
                        cad.Remark = $"無雨量資料{cad.RainNo}";
                    else
                    {
                        if (rh1ajust != null)
                            rjt["H1"] = rh1ajust.Value;

                        var rb = GetRainBase().Where(s => s.Value<string>("StationNo") == cad.RainNo ).FirstOrDefault();
                        if (rb != null)
                            cad.RainName = rb.Value<string>("StationName");

                        cad.Rain = Newtonsoft.Json.JsonConvert.SerializeObject(rjt);
                        double rh1 = rjt.Value<double>("H1");
                        double rh3 = rjt.Value<double>("H3");
                        double rh6 = rjt.Value<double>("H6");


                        double y1, y3, y6;
                        #region  計算線性y值，1.雨量負值，y給999，2.y介於最大及最小間
                        if (rh1 < 0)
                            y1 = 999;
                        else
                        {
                            y1 = p.H1a * rh1 + p.H1b;
                            y1 = y1 >= p.Max ? p.Max : (y1 <= p.Min ? p.Min : y1);
                        }
                        if (rh3 < 0)
                            y3 = 999;
                        else
                        {
                            y3 = p.H3a * rh3 + p.H3b;
                            y3 = y3 >= p.Max ? p.Max : (y3 <= p.Min ? p.Min : y3);
                        }
                        if (rh6 < 0)
                            y6 = 999;
                        else
                        {
                            y6 = p.H6a * rh6 + p.H6b;
                            y6 = y6 >= p.Max ? p.Max : (y6 <= p.Min ? p.Min : y6);
                        }
                        #endregion

                        double wvalue = -999;
                        #region 取及時水位資訊
                        var wp = WaterIowMappings.FirstOrDefault(s => s.WaterNo == cad.WaterNo);
                        
                        if (wp != null) //有IOW設定
                        {
                            var pq = IotApi.WraIotApi.GetLatestData_PhysicalQuantity(WraIowToken, wp.Uuid);
                            if (pq == null)
                            {
                                cad.Remark = $"水位站{cad.WaterNo}，查無IOW({wp.Uuid})資料!!";
                                continue;
                            }
                            wvalue = pq.Value;
                            cad.WaterName = wp.Name;
                            cad.Water = Newtonsoft.Json.JsonConvert.SerializeObject(pq);
                        }
                        //抓FHY
                        else if (fhywaters != null && fhywaters.FirstOrDefault(s => s.Value<string>("StationNo") == cad.WaterNo) != null)
                        {
                            var ss = GetFhyWaterBase();
                            var wb = GetFhyWaterBase().Where(s => s.Value<string>("StationNo") == cad.WaterNo ).FirstOrDefault();
                            if (wb != null)
                                cad.WaterName = wb.Value<string>("StationName");
                            var fw = fhywaters.FirstOrDefault(s => s.Value<string>("StationNo") == cad.WaterNo);
                            wvalue = fw.Value<double>("WaterLevel");
                            cad.Water = Newtonsoft.Json.JsonConvert.SerializeObject(fw);
                        }
                        //抓屏東水位
                        else if (ptwaters != null && ptwaters.FirstOrDefault(s => s.Value<string>("StationUUID") == cad.WaterNo) != null)
                        {
                            var ps = ptwaters.FirstOrDefault(s => s.Value<string>("StationUUID") == cad.WaterNo);
                            var pw = ps.Value<JArray>("data").FirstOrDefault();
                            if (pw != null)
                            {
                                wvalue = pw.Value<double>("Value");
                                cad.WaterName = ps.Value<string>("StationName");
                                cad.Water = Newtonsoft.Json.JsonConvert.SerializeObject(pw);
                            }
                        }
                        //抓桃園水位
                        else if (tywaters != null && tywaters.FirstOrDefault(s => s.Value<string>("STATION_ID") == cad.WaterNo) != null)
                        {
                            var ps = tywaters.FirstOrDefault(s => s.Value<string>("STATION_ID") == cad.WaterNo);
                            wvalue = ps.Value<double>("WATERHEIGHT_M");
                            //if (pw != null)
                            //{
                            //    wvalue = pw.Value<double>("Value");
                            cad.WaterName = ps.Value<string>("STATION");
                            cad.Water = Newtonsoft.Json.JsonConvert.SerializeObject(ps);
                            //}
                        }
                        //無任何資料
                        if (wvalue == -999)
                        {
                            cad.Remark = $"水位站{cad.WaterNo}，查無水位資料!!";
                            continue;
                        }
                        #endregion


                        cad.Alert = false;
                        int alertH = -1;
                        var calp = "";
                        if (wvalue >= y1)
                        {
                            alertH = 1;
                            calp = p.H1;
                        }
                        else if (wvalue >= y3)
                        {
                            alertH = 3;
                            calp = p.H3;
                        }
                        else if (wvalue >= y6)
                        {
                            alertH = 6;
                            calp = p.H6;
                        }
                        if (alertH > 0)
                        {
                            cad.Alert = true;
                            cad.Remark = $"複合指標{alertH}小時延時警戒,{calp}";
                            cad.Villages = AffectedVillageMappings.Where(s=>s.County==p.County && p.District.StartsWith(s.District) && s.SubDistrict ==p.SubDistrict).ToList();
                        }
                    }


                    //DouHelper.Misc.AddCache(r, key);
                }
                if (rh1ajust == null)
                {
                    CacheLastAlert = r;
                    var path = System.Web.Hosting.HostingEnvironment.MapPath($"~/Data/Alert/{datadt.ToString("yyyy/MM/dd")}");
                    if (!Directory.Exists(path))
                        Directory.CreateDirectory(path);
                    string cachef = System.IO.Path.Combine(path, $"{datadt.ToString("yyyyMMddHHmm")}.xml");
                    DouHelper.Misc.SerializeBinary(r, cachef);
                    DouHelper.Misc.SerializeObjectSaveJsonFile(r, cachef.Replace(".xml", ".json"));
                }
            }

            return r;
        }


        #region 取雨量、水位等資料
        public JArray GetRainBase()
        {
            string key = "GetRainBase";
            JArray r = DouHelper.Misc.GetCache<JArray>(60*60 * 1000, key);
            if (r == null)
            {
                try
                {
                    var jt = GetFhyData("Rainfall/Station");
                    if (jt != null && jt.Value<JArray>("Data") != null)
                    {
                        r = jt.Value<JArray>("Data");
                        DouHelper.Misc.AddCache(r, key);
                    }
                }
                catch (Exception ex)
                {
                    Logger.Log.For(this).Error("GetWaterRt Err:\n" + ex.Message);
                }
            }
            return r;
        }
        public JArray GetRainRt()
        {
            var jt = GetFhyRainRealTime();
            if (jt != null && jt.Value<JArray>("Data") != null)
                return jt.Value<JArray>("Data");
            return null;
        }

        public DateTime GetRainRtUpdataTime()
        {
            var r = DateTime.MinValue;
            var jt = GetFhyRainRealTime();
            if (jt != null && jt.Value<DateTime?>("UpdataTime") != null)
                r = jt.Value<DateTime>("UpdataTime");
            return r;
        }
        public JToken GetFhyRainRealTime()
        {
            string key = "GetFhyRainRealTime";
            JToken r = DouHelper.Misc.GetCache<JToken>(60 * 1000, key);
            if (r == null)
            {
                r = GetFhyData("Rainfall/Info/RealTime");

                if (r != null || r.Value<JArray>("Data") != null)
                {
                    //r = jt.Value<DateTime>("UpdataTime");
                    DouHelper.Misc.AddCache(r, key);
                }
            }
            return r;
        }

        #region fhy取得淹水警示資料
        /// <summary>
        /// fhy取得淹水警示資料
        /// </summary>
        /// <returns></returns>
        [Route("api/fhy/rainfall/warnning")]
        public JToken GetFhyRainfallWarning()
        {
            string key = "GetFhyRainfallWarning";
            JToken r = DouHelper.Misc.GetCache<JToken>(60 * 1000, key);
            if (r == null)
            {
                r = GetFhyData("Rainfall/Warning");
                if (r != null && r.Value<DateTime?>("UpdataTime") != null)
                {
                    var datadt = r.Value<DateTime>("UpdataTime");
                    var datas = r.Value<JArray>("Data");
                    //if (r != null || r.Value<JArray>("Data") != null)
                    //{
                    //    //r = jt.Value<DateTime>("UpdataTime");

                    //}
                    if (datas.Count > 0)
                    {
                        var dt = datas.First().Value<DateTime>("Time");
                        DouHelper.Misc.AddCache(r, key);
                        var path = System.Web.Hosting.HostingEnvironment.MapPath($"~/Data/RainfallWarnning/{dt.ToString("yyyy/MM/dd")}");
                        if (!Directory.Exists(path))
                            Directory.CreateDirectory(path);
                        string cachef = System.IO.Path.Combine(path, $"{dt.ToString("yyyyMMddHHmm")}.xml");
                        //DouHelper.Misc.SerializeBinary(r, cachef);
                        DouHelper.Misc.SerializeObjectSaveJsonFile(r, cachef.Replace(".xml", ".json"));
                    }

                }
                else
                    r = null;
                
            }
            return r;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="dt">yyyyMMddHHmm</param>
        /// <returns></returns>
        [Route("api/fhy/rainfall/warnning/{dt}")]
        public JToken GetFhyRainfallWarningByTime(string dt)
        {
            if (string.IsNullOrEmpty(dt) || dt.Length != 12)
                throw new Exception("日期參數格式有誤!!");
            dt = dt.Substring(0, 11) + "0";
            DateTime qtime = DateTime.ParseExact(dt,"yyyyMMddHHmm", CultureInfo.InvariantCulture);
            string key = "GetFhyRainfallWarningByTime"+qtime;
            JToken r = DouHelper.Misc.GetCache<JToken>(60 * 1000, key);
            if (r == null)
            {
                var path = System.Web.Hosting.HostingEnvironment.MapPath($"~/Data/RainfallWarnning/{qtime.ToString("yyyy/MM/dd")}");

                string cachef = System.IO.Path.Combine(path, $"{qtime.ToString("yyyyMMddHHmm")}.json");
                if (File.Exists(cachef))
                {
                    r = DouHelper.Misc.DeSerializeObjectLoadJsonFile<JToken>(cachef);// ializeObjectSaveJsonFile(r, cachef); DouHelper.Misc.DeSerialize<List<CAlertData>>(cachef);
                    DouHelper.Misc.AddCache(r, key);
                }

            }
            return r;
        }
        #endregion


        public JArray GetFhyWaterBase()
        {
            string key = "GetFhyWaterBase";
            JArray r = DouHelper.Misc.GetCache<JArray>(60*60 * 1000, key);
            if (r == null)
            {
                try
                {
                    var jt = GetFhyData("WaterLevel/Station");
                    if (jt != null && jt.Value<JArray>("Data") != null)
                    {
                        r = jt.Value<JArray>("Data");
                        DouHelper.Misc.AddCache(r, key);
                    }
                }
                catch (Exception ex)
                {
                    Logger.Log.For(this).Error("GetWaterRt Err:\n" + ex.Message);
                }
            }
            return r;
        }
        public JArray GetFhyWaterRt()
        {
            string key = "GetFhyWaterRt";
            JArray r = DouHelper.Misc.GetCache<JArray>(60 * 1000, key);
            if (r == null)
            {
                try
                {
                    var jt = GetFhyData("WaterLevel/Info/RealTime");
                    if (jt != null && jt.Value<JArray>("Data") != null)
                    {
                        r = jt.Value<JArray>("Data");
                        DouHelper.Misc.AddCache(r, key);
                    }
                }
                catch (Exception ex)
                {
                    Logger.Log.For(this).Error("GetWaterRt Err:\n" + ex.Message);
                }
            }
            return r;
        }
        public JArray GetWaterRt()
        {
            string key = "GetWaterRt";
            JArray r = DouHelper.Misc.GetCache<JArray>(60 * 1000, key);
            if (r == null)
            {
                try
                {
                    var jt = GetFhyData("WaterLevel/Info/RealTime");
                    if (jt != null && jt.Value<JArray>("Data") != null)
                    {
                        r = jt.Value<JArray>("Data");
                        DouHelper.Misc.AddCache(r, key);
                    }
                }
                catch (Exception ex)
                {
                    Logger.Log.For(this).Error("GetWaterRt Err:\n" + ex.Message);
                }
            }
            return r;
        }
        public JArray GetPTWaterRt()
        {
            string key = "GetPTWaterRt";
            JArray r = DouHelper.Misc.GetCache<JArray>(60 * 1000, key);
            if (r == null)
            {
                try
                {
                    var jt = DouHelper.HClient.Get<JToken>(Startup.AppSet.PTWaterApiUrl).Result.Result; ;
                    if (jt != null && jt.Value<string>("Status").Equals("OK"))
                    {
                        r = jt.Value<JArray>("station");
                        DouHelper.Misc.AddCache(r, key);
                    }
                }
                catch (Exception ex)
                {
                    Logger.Log.For(this).Error("GetPTWaterRt Err:\n" + ex.Message);
                }
            }
            return r;
        }
        string WraIowToken
        {
            get
            {
                IotApi.WraIotApi.IOT_USERID = "NmD7zaQ3GK/j5TDcRtwY1JnTC4LNbbCw";
                IotApi.WraIotApi.IOT_USERSECRET = "+s8+0pM2XhS0YKXhWTiakQ==";
                string key = "WraIowToken";
                string token = DouHelper.Misc.GetCache<string>(warIotTokenExpiresIn, key);
                if (token == null)
                {
                    Token tr = null;
                    //嘗試2次
                    try
                    {
                        tr = WraIotApi.GetToken().Result;
                        
                    }
                    catch {
                        Thread.Sleep(2000);
                        tr = WraIotApi.GetToken().Result;
                    }
                    token = tr.AccessToken;
                    warIotTokenExpiresIn = (tr.ExpiresIn -1)*1000;
                    if (!string.IsNullOrEmpty(token))
                        DouHelper.Misc.AddCache(token, key);
                    
                }
                return token;
            }
        }
        static int warIotTokenExpiresIn = 10 * 60 * 1000;
        JToken GetFhyData(string p)
        {
            return DouHelper.HClient.Get<JToken>(Startup.AppSet.WraFhyApiUrl + p, "application/json", new KeyValuePair<string, string>[] { new KeyValuePair<string, string>("Apikey", Startup.AppSet.WraFhyApiKey ) }).Result.Result;
        }

        

        public JArray GetTaoyuanWater()
        {
            JArray r = null;
            try
            {
                var ss = new WebClient().DownloadString(Startup.AppSet.TYWaterApiUrl);
                XmlDocument xml = new XmlDocument();
                xml.LoadXml(ss);
                string jsonString = JsonConvert.SerializeXmlNode(xml);
               r= JsonConvert.DeserializeObject<JToken>(jsonString).Value<JToken>("ROOT").Value<JArray>("DATA");
            }
            catch (Exception e)
            {
                Logger.Log.For(this).Error("取桃園水位資訊有問題! " + e.Message);
            }
            
            return r;
        }
        #endregion

        #region 參數資料
        static List<AlertPara> _AlertParas;
        List<AlertPara> AlertParas
        {
            get
            {
                if (_AlertParas == null)
                {

                    _AlertParas = new List<AlertPara>();
                    var f = System.IO.Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath("~/Data"), "複合警戒參數.csv");
                    using (StreamReader sr = new StreamReader(f, Encoding.GetEncoding("big5")))
                    {
                        string lineStr = sr.ReadLine();
                        while ((lineStr = sr.ReadLine()) != null)
                        {
                            string[] datas = lineStr.Split(new char[] { ',' });//, StringSplitOptions.RemoveEmptyEntries);
                            if (datas.Length < 9 || string.IsNullOrEmpty(datas[8]))
                                continue;
                           
                            if (_AlertParas.FirstOrDefault(s => s.SubDistrict == datas[3]) != null)
                                continue;
                            _AlertParas.Add(new AlertPara
                            {
                                Id = datas[0].Trim(),
                                SubDistrict = datas[3].Trim(),
                                County = datas[1].Trim(),
                                District = datas[2].Trim(),
                                RainNo = datas[5].Trim(),
                                WaterNo = datas[7].Trim(),
                                H1 = (datas[8].Trim() + "," + datas[9].Trim()).Replace("\"", ""),
                                H3 = (datas[10].Trim() + "," + datas[11].Trim()).Replace("\"", ""),
                                H6 = (datas[12].Trim() + "," + datas[13].Trim()).Replace("\"", ""),
                                Max = Convert.ToDouble(datas[14].Trim()),
                                Min = Convert.ToDouble(datas[15].Trim())
                            });
                        }
                    }
                }
                return _AlertParas;
            }
        }

        static List<WaterIowMapping> _WaterIowMappings;
        List<WaterIowMapping> WaterIowMappings
        {

            get
            {
                if (_WaterIowMappings == null)
                {
                    _WaterIowMappings = new List<WaterIowMapping>();

                    var f = System.IO.Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath("~/Data"), "IOW.csv");
                    using (StreamReader sr = new StreamReader(f, Encoding.GetEncoding("big5")))
                    {
                        string lineStr = sr.ReadLine();
                        while ((lineStr = sr.ReadLine()) != null)
                        {
                            string[] datas = lineStr.Split(new char[] { ',' });//, StringSplitOptions.RemoveEmptyEntries);
                            if (datas.Length < 10 || string.IsNullOrEmpty(datas[4]) || string.IsNullOrEmpty(datas[9]))
                                continue;
                            _WaterIowMappings.Add(new WaterIowMapping
                            {
                                WaterNo = datas[9],
                                County = datas[1],
                                District = datas[2],
                                Name = datas[3],
                                Uuid = datas[4]
                            });

                        }
                    }
                }
                return _WaterIowMappings;
            }
        }

        static List<AffectedVillage> _AffectedVillageMapping;
        List<AffectedVillage> AffectedVillageMappings
        {
            get
            {
                if (_AffectedVillageMapping == null)
                {
                    _AffectedVillageMapping = new List<AffectedVillage>();

                    var f = System.IO.Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath("~/Data"), "村里對照.csv");
                    using (StreamReader sr = new StreamReader(f, Encoding.GetEncoding("big5")))
                    {
                        string lineStr = sr.ReadLine();
                        while ((lineStr = sr.ReadLine()) != null)
                        {
                            string[] datas = lineStr.Split(new char[] { ',' });//, StringSplitOptions.RemoveEmptyEntries);
                            if (datas.Length < 6)
                                continue;
                            _AffectedVillageMapping.Add(new AffectedVillage
                            {
                                County = datas[5],
                                District = datas[1],
                                SubDistrict = datas[2],
                                Name = datas[3],
                                Code = datas[4]
                            });

                        }
                    }
                }
                return _AffectedVillageMapping;
            }
        }
        #endregion
    }


    public class CAlertData
    {
        public string Name { get; set; }
        public string County { get; set; }
        public string District { get; set; }
        public string RainNo { get; set; }
        public string RainName { get; set; }
        public string Rain { get; set; }
        public string WaterNo { get; set; }
        public string WaterName { get; set; }
        public string Water { get; set; }
        [JsonProperty(Order = 900)]
        public bool? Alert { set; get; }
        [JsonProperty(Order = 990)]
        public string Remark { set; get; }
        [JsonProperty(Order = 999)]
        public List<AffectedVillage> Villages { set; get; }
    }

    public class AffectedVillage
    {
        internal string County { get; set; }
        internal string District { get; set; }
        internal string SubDistrict { get; set; }
        public string Name { set; get; }
        public string Code { set; get; }
    }

    public class AlertPara
    {
        public string Id { get; set; }
        public string SubDistrict { get; set; }
        public string County { get; set; }
        public string District { get; set; }
        public string RainNo { get; set; }
        public string WaterNo { get; set; }
        public string H1 { get; set; }

        public string H3 { get; set; }
        public string H6 { get; set; }
        public double Max { get; set; }
        public double Min { get; set; }

        internal double H1a
        {
            get
            {
                return double.Parse(H1.Split(new char[] { ',' })[0]);
            }
        }
        internal double H1b
        {
            get
            {
                return double.Parse(H1.Split(new char[] { ',' })[1]);
            }
        }
        internal double H3a
        {
            get
            {
                return double.Parse(H3.Split(new char[] { ',' })[0]);
            }
        }
        internal double H3b
        {
            get
            {
                return double.Parse(H3.Split(new char[] { ',' })[1]);
            }
        }
        internal double H6a
        {
            get
            {
                return double.Parse(H6.Split(new char[] { ',' })[0]);
            }
        }
        internal double H6b
        {
            get
            {
                return double.Parse(H6.Split(new char[] { ',' })[1]);
            }
        }
    }
    public class WaterIowMapping
    {
        public string WaterNo { get; set; }
        public string County { get; set; }
        public string District { get; set; }
        public string Name { get; set; }
        public string Uuid { get; set; }
    }
}