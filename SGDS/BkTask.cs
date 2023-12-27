using Dou.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SGDS.Controllers.Api;
using SGDS.Models.SixBox;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Dynamic;
using System.EnterpriseServices.Internal;
using System.IO;
using System.Linq;
using System.Threading;
using System.Web;
using System.Web.Caching;
using System.Xml.Linq;
using static System.Collections.Specialized.BitVector32;

namespace SGDS
{
    public class BkTask
    {
        public BkTask()
        {
            // 從組態檔載入相關參數，例如 SmtpHost、SmtpPort、SenderEmail 等等.
        }
        private DateTime startdt = DateTime.Now;
        private int runCount = 0;
        private bool _stopping = false;


        public void Run()
        {
            Logger.Log.For(this).Info("啟動BkTask背景");
            WriteLog(Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath(("~/log")), $"startlog{DateTime.Now.ToString("yyyyyMMdd")}.txt"), $"{DateTime.Now.ToString("yyyy/MM/dd HH:mm:ss")}啟動BkTask背景");
            var aThread = new Thread(TaskLoop);
            aThread.IsBackground = true;
            aThread.Priority = ThreadPriority.BelowNormal;  // 避免此背景工作拖慢 ASP.NET 處理 HTTP 請求.
            aThread.Start();
        }

        public void Stop()
        {
            _stopping = true;
        }

        void DeleteExpiredLog()
        {
            Debug.WriteLine($"{DateTime.Now.ToString("yyyy/MM/dd HH:mm:ss")} DeleteExpiredLog");
            _DeleteExpiredFile(System.Web.Hosting.HostingEnvironment.MapPath("~/log"), "startlog*", 15);
            _DeleteExpiredFile(System.Web.Hosting.HostingEnvironment.MapPath("~/Data/Alert"), "FhyUpdataTime*", 90);
            _DeleteExpiredFile(System.Web.Hosting.HostingEnvironment.MapPath("~/Data/RainfallWarnning"), "FhyRainfallWarnningUpdataTime*", 30);
            //_DeleteExpiredFile(System.Web.Hosting.HostingEnvironment.MapPath("~/Data/SO"), SFC.Controllers.Api.DCDataController.SOPD_FILE_PREFIX + "*", 15);
        }

        void _DeleteExpiredFile(string path, string searchPattern, int expiredDay)
        {
            try
            {
                Directory.GetFiles(path, searchPattern).ToList().ForEach(f =>
                {
                    var finfo = new FileInfo(f);
                    if ((DateTime.Now - finfo.CreationTime).TotalDays > expiredDay)
                    {
                        finfo.Delete();
                        Debug.WriteLine($"Delete:{f}");
                    }
                });
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
            }
        }


        private void TaskLoop()
        {
            Thread.Sleep(1000);
            TodoCctv();
            TodoCalAlert();
            TodoFhyRainfallWarnning();
            //TodoTyph();
            TodoSixBoxScreenShot();
            TodoDeleteExpiredLog();
        }

        void Todo(Action todo, Func<int> intervalAction, int firstTimeDelay=1, Action<Exception> err = null)
        {
            System.Diagnostics.StackTrace stackTrace = new System.Diagnostics.StackTrace();
            System.Reflection.MethodBase methodBase = stackTrace.GetFrame(1).GetMethod();
            string mn = methodBase.Name;

            System.Timers.Timer theTimer = new System.Timers.Timer();
            theTimer.Elapsed += (sender, e) =>
            {
                theTimer.Stop();
                Debug.WriteLine($"{DateTime.Now.ToString("yyyy/MM/dd HH:mm:ss")} {mn} id:{Thread.CurrentThread.ManagedThreadId}");
                //Logger.Log.For(this).Info("背景TaskLoop on thread ID: " + Thread.CurrentThread.ManagedThreadId.ToString());
                
                
                try
                {
                    if (todo != null)
                    {
                        todo.Invoke();
                    }
                }
                catch(Exception ex) 
                {
                    Logger.Log.For(this).Error($"背景錯誤{mn}\n" + ex.ToString());
                    if (err != null)
                        err.Invoke(ex);

                }
                finally
                {
                    theTimer.Interval = intervalAction.Invoke();
                    theTimer.Start();
                }
            };
            theTimer.Interval = firstTimeDelay;
            theTimer.Start();
        }

        
        int defaultCalInterval = 1 * 60 * 1000;
        //計算複合淹水
        void TodoCalAlert()
        {
            DateTime lastdt = DateTime.MinValue;
            var config = System.IO.Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath($"~/Data/Alert"), $"Config.json");
            var fhyUpdataTimeLog = System.IO.Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath($"~/Data/Alert"), $"FhyUpdataTime_{DateTime.Now.ToString("yyyyMM")}.txt");
            int nextrun = defaultCalInterval;
            int firstTimeDelay = 1;
            #region 讀取上次雨量資料最後一次更新時間，決定firstTimeDelay
            if (File.Exists(config))
            {
                try
                {
                    lastdt = DouHelper.Misc.DeSerializeObjectLoadJsonFile<JToken>(config).Value<DateTime>("RainLastUpdataTime");
                    firstTimeDelay = 10 * 60 * 1000 + 20 * 1000 - (int)(DateTime.Now - lastdt).TotalMilliseconds;//30*1000多一些buffer
                    if (firstTimeDelay > 10 * 60 * 1000 || firstTimeDelay < 0) //無資料或與fhy server有時間差
                        firstTimeDelay = 1;
                }
                catch{ }
            }
            #endregion

            Todo(() => { //to run
                Logger.Log.For(this).Info("啟動計算複合淹水");

                var temp = $"執行時間:{DateTime.Now.ToString("yyyy/MM/dd HH:mm:ss")}，資料fhy上次更新時間:{lastdt.ToString("yyyy/MM/dd HH:mm:ss")}， ";

                
                var tempdt= new ComplexAlertController().GetRainRtUpdataTime();
                if (tempdt == lastdt)
                {
                    nextrun = defaultCalInterval;
                }
                else
                {
                    
                    new ComplexAlertController().CalAlert();
                    lastdt = tempdt;
                    temp += $"資料fhy本次更新時間:{lastdt.ToString("yyyy/MM/dd HH:mm:ss")}，";

                    //設定下次啟動時間
                    nextrun = 10 * 60 * 1000 + 20 * 1000 - (int)(DateTime.Now - lastdt).TotalMilliseconds;//30*1000多一些buffer
                    if (nextrun > 12 * 60 * 1000 || nextrun < 0) //無資料或與fhy server有時間差
                        nextrun = defaultCalInterval;
                    DouHelper.Misc.SerializeObjectSaveJsonFile(new { RainLastUpdataTime = lastdt }, config);//紀錄雨量資料最後一次更新時間
                    temp += $"資料fhy下次預計更新時間:{DateTime.Now.AddMilliseconds(nextrun).ToString("yyyy/MM/dd HH:mm:ss")}，";
                }
                WriteLog(fhyUpdataTimeLog, temp);
            },
            () => { //Timer間個
                Debug.WriteLine($"\n\n\nTodoCalAlert 下次執行時間{nextrun}毫秒, 最新rain時間{lastdt}");
                Logger.Log.For(this).Info($"複合淹水下次執行時間{nextrun}毫秒, 最新rain時間{lastdt}");
                return nextrun;
            },
            firstTimeDelay
            ,
            (ex) => //Error
            {
                nextrun = defaultCalInterval;
                Debug.WriteLine(ex.ToString());
                WriteLog(fhyUpdataTimeLog, ex.Message);
            }
            );
        }
        void TodoFhyRainfallWarnning()
        {
            DateTime lastdt = DateTime.MinValue;
            var config = System.IO.Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath($"~/Data/RainfallWarnning"), $"FhyRainfallWarnningConfig.json");
            var fhyUpdataTimeLog = System.IO.Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath($"~/Data/RainfallWarnning"), $"FhyRainfallWarnningUpdataTime_{DateTime.Now.ToString("yyyyMMdd")}.txt");
            int nextrun = defaultCalInterval;
            int firstTimeDelay = 1;
            #region 讀取上次雨量資料最後一次更新時間，決定firstTimeDelay
            if (File.Exists(config))
            {
                try
                {
                    lastdt = DouHelper.Misc.DeSerializeObjectLoadJsonFile<JToken>(config).Value<DateTime>("FhyRainfallWarnningUpdataTime");
                    firstTimeDelay = 10 * 60 * 1000 + 20 * 1000 - (int)(DateTime.Now - lastdt).TotalMilliseconds;//30*1000多一些buffer
                    if (firstTimeDelay > 10 * 60 * 1000 || firstTimeDelay < 0) //無資料或與fhy server有時間差
                        firstTimeDelay = 1;
                }
                catch { }
            }
            #endregion

            if (!Directory.Exists(System.Web.Hosting.HostingEnvironment.MapPath($"~/Data/RainfallWarnning")))
                Directory.CreateDirectory(System.Web.Hosting.HostingEnvironment.MapPath($"~/Data/RainfallWarnning"));

            Todo(() => { //to run
                Logger.Log.For(this).Info("抓fhy取得淹水警示資料");

                var temp = $"執行時間:{DateTime.Now.ToString("yyyy/MM/dd HH:mm:ss")}，資料fhy上次更新時間:{lastdt.ToString("yyyy/MM/dd HH:mm:ss")}， ";


                JToken jt = new ComplexAlertController().GetFhyRainfallWarning();
                if(jt == null)
                {
                    nextrun = defaultCalInterval;
                }
                else
                {
                    lastdt = jt.Value<DateTime>("UpdataTime");
                    temp += $"資料fhy本次更新時間:{lastdt.ToString("yyyy/MM/dd HH:mm:ss")}，";
                    //設定下次啟動時間
                    nextrun = 10 * 60 * 1000 + 20 * 1000 - (int)(DateTime.Now - lastdt).TotalMilliseconds;//30*1000多一些buffer
                    if (nextrun > 12 * 60 * 1000 || nextrun < 0) //無資料或與fhy server有時間差
                        nextrun = defaultCalInterval;
                    DouHelper.Misc.SerializeObjectSaveJsonFile(new { RainfallWarnningLastUpdataTime = lastdt }, config);//紀錄雨量資料最後一次更新時間
                    temp += $"資料fhy下次預計更新時間:{DateTime.Now.AddMilliseconds(nextrun).ToString("yyyy/MM/dd HH:mm:ss")}，";
                }
               
                WriteLog(fhyUpdataTimeLog, temp);
            },
            () => { //Timer間個
                Debug.WriteLine($"\n\n\nTodoCalAlert 下次執行時間{nextrun}毫秒, 最新rain時間{lastdt}");
                Logger.Log.For(this).Info($"複合淹水下次執行時間{nextrun}毫秒, 最新rain時間{lastdt}");
                return nextrun;
            },
            firstTimeDelay
            ,
            (ex) => //Error
            {
                nextrun = defaultCalInterval;
                Debug.WriteLine(ex.ToString());
                WriteLog(fhyUpdataTimeLog, ex.Message);
            }
            );
        }
        //抓fmg CCTV
        void TodoCctv()
        {
            Todo(() => { new CctvController().GetFmgAllCctvStation(); }, () => { return 5*60 * 1000; });
        }
        void TodoSixBoxScreenShot()
        {
            Todo(() => { ScreenShot.GetAllStation(); }, () => { return 2 * 60 * 1000; });
        }

        T GetXElemetValue<T>(XElement parent, string xename)
        {
            if (parent.Element(parent.Name.Namespace + xename) == null)
                return default(T);
            else
                try
                {
                    return (T)Convert.ChangeType(parent.Element(parent.Name.Namespace + xename).Value, typeof(T));
                }
                catch 
                {
                    return default(T);
                }
        }
        T GetJTokenValue<T>(JToken jt, string name)
        {
            return jt.Value<T>(name);
            //if (jt.Value<T>.Element(parent.Name.Namespace + xename) == null)
            //    return default(T);
            //else
            //    try
            //    {
            //        return (T)Convert.ChangeType(parent.Element(parent.Name.Namespace + xename).Value, typeof(T));
            //    }
            //    catch
            //    {
            //        return default(T);
            //    }
        }
        //抓颱風資料
        void TodoTyph()
        {
            DateTime LastDT = DateTime.MinValue;
            var typhErrLog = System.IO.Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath($"~/Data/typh"), $"typherr_{DateTime.Now.ToString("yyyyMMdd")}.txt");

            Todo(() => {
                //if (LastDT.ToString("yyyyMMddHH") != DateTime.Now.ToString("yyyyMMddHH"))
                //{
                var cwajson = DouHelper.HClient.Get<JToken>("https://opendata.cwa.gov.tw/fileapi/v1/opendataapi/W-C0034-005?Authorization=CWB-AB2D9D1E-94B3-4F31-A9EE-2115D507CA49&downloadType=WEB&format=JSON").Result.Result;
                //var cwajson = DouHelper.HClient.Get<JToken>("https://www.dprcflood.org.tw/FDIS/Data/Typh/json/CWB-TropicalCyclone_20230904181502_0.json").Result.Result;
                //var cwajson = DouHelper.HClient.Get<JToken>("https://www.dprcflood.org.tw/FDIS/Data/Typh/json/CWB-TropicalCyclone_20230904191453_0.json").Result.Result;
                var sent = cwajson.Value<JToken>("cwaopendata").Value<DateTime>("sent");
                var identifier = cwajson.Value<JToken>("cwaopendata").Value<string>("identifier");

                //json
                LastDT = sent;
                string p = System.Web.Hosting.HostingEnvironment.MapPath($"~/Data/Typh");
                var fc = Directory.GetFiles(p, $"{identifier}*.json");

                string f = System.IO.Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath($"~/Data/Typh/json/{identifier}_{fc.Count()}.json"));
                if (!Directory.Exists(Path.GetDirectoryName(f)))
                    Directory.CreateDirectory(Path.GetDirectoryName(f));
                DouHelper.Misc.SerializeObjectSaveJsonFile(cwajson, f);

                //cap
                XDocument xd = XDocument.Load("https://opendata.cwa.gov.tw/fileapi/v1/opendataapi/W-C0034-001?Authorization=CWB-AB2D9D1E-94B3-4F31-A9EE-2115D507CA49&downloadType=WEB&format=CAP");
                //XDocument xd = XDocument.Load("https://www.dprcflood.org.tw/FDIS/Data/Typh/cap/CWB-Weather_typhoon-warning_202309041815001.cap");
                //XDocument xd = XDocument.Load("https://www.dprcflood.org.tw/FDIS/Data/Typh/cap/CWB-Weather_typhoon-warning_202309041915001.cap");
                var cpaidentifier = xd.Root.Element(xd.Root.Name.Namespace + "identifier").Value;
                var cappath = System.Web.Hosting.HostingEnvironment.MapPath($"~/Data/Typh/cap");
                if (!Directory.Exists(cappath))
                    Directory.CreateDirectory(cappath);
                xd.Save(System.IO.Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath($"~/Data/Typh/cap"),$"{cpaidentifier}.cap"));


                //依cap資料組typhinfo
                var tdatap = System.Web.Hosting.HostingEnvironment.MapPath($"~/Data/Typh/data");
                if (!Directory.Exists(tdatap))
                    Directory.CreateDirectory(tdatap);
                IEnumerable<XElement> infoexs = xd.Root.Descendants(xd.Root.Name.Namespace + "info");
                if(infoexs == null || infoexs.Count() == 0)
                {
                    WriteLog(typhErrLog,$"{cpaidentifier} cap 無info");
                }
                
                foreach (var info in infoexs)
                {
                    WriteLog(typhErrLog, info.Element(info.Name.Namespace + "headline").Value);
                    var sections = info.Descendants(info.Name.Namespace + "section");
                    if(sections==null || sections.Count() == 0)
                    {
                        continue;
                    }
                    //颱風編號
                    var tno = DateTime.Now.Year + Convert.ToInt16(sections.Where(x => x.Attribute("title").Value == "颱風編號").FirstOrDefault().Value).ToString("00");
                    tno = tno.Substring(2);
                    var _tinfo = sections.Where(x => x.Attribute("title").Value == "颱風資訊").FirstOrDefault();
                    if (_tinfo==null)
                    {
                        WriteLog(typhErrLog, $"{cpaidentifier}無颱風資訊");
                        continue;
                    }

                    Typh _Typh = new Typh
                    {
                        year = DateTime.Now.Year,
                        no= tno,
                        typhoon_name = GetXElemetValue<string>(_tinfo, "typhoon_name"),// _tinfo.Element(_tinfo.Name.Namespace + "typhoon_name").Value,
                        cwa_typhoon_name = GetXElemetValue<string>(_tinfo, "cwa_typhoon_name")//_tinfo.Element(_tinfo.Name.Namespace + "cwa_typhoon_name").Value
                    };
                    //觀測
                    var analysisex = _tinfo.Element(_tinfo.Name.Namespace + "analysis");
                    TyphInfoAnalysis _Analysis = new TyphInfoAnalysis
                    {
                        time = GetXElemetValue<DateTime>(analysisex, "time"),
                        lon = Convert.ToDouble(GetXElemetValue<string>(analysisex, "position").Split(new char[] { ',' })[1]),
                        lat = Convert.ToDouble(GetXElemetValue<string>(analysisex, "position").Split(new char[] { ',' })[0]),
                        max_winds = GetXElemetValue<int>(analysisex, "max_winds"),
                        gust = GetXElemetValue<int>(analysisex, "gust"),
                        pressure = GetXElemetValue<int>(analysisex, "pressure"),
                        radius_of_15mps = GetXElemetValue<int>(analysisex, "radius_of_15mps"),
                        radius_of_25mps = GetXElemetValue<int>(analysisex, "radius_of_25mps"),
                        current_place = sections.Where(x => x.Attribute("title").Value == "命名與位置").FirstOrDefault()?.Value,
                        move = sections.Where(x => x.Attribute("title").Value == "移速與預測").FirstOrDefault()?.Value,
                        type = sections.Where(x => x.Attribute("title").Value == "警報類別").FirstOrDefault().Value,
                        warn_no = sections.Where(x => x.Attribute("title").Value == "警報報數").FirstOrDefault().Value ,//+ "-" + _type,
                        scale = analysisex.Descendants(analysisex.Name.Namespace + "scale").Where(x => x.Attribute("lang").Value == "zh-TW").FirstOrDefault()?.Value
                    };
                    //預報
                    var predictionex = _tinfo.Element(_tinfo.Name.Namespace + "prediction");
                    TyphInfoPrediction _Prediction = new TyphInfoPrediction
                    {
                        time = GetXElemetValue<DateTime>(predictionex, "time"),
                        lon = Convert.ToDouble(GetXElemetValue<string>(predictionex, "position").Split(new char[] { ',' })[1]),
                        lat = Convert.ToDouble(GetXElemetValue<string>(predictionex, "position").Split(new char[] { ',' })[0]),
                        max_winds = GetXElemetValue<int>(predictionex, "max_winds"),
                        pressure = GetXElemetValue<int>(predictionex, "pressure"),
                        radius_of_15mps = GetXElemetValue<int>(predictionex, "radius_of_15mps"),
                        radius_of_25mps = GetXElemetValue<int>(predictionex, "radius_of_25mps"),
                        gust = GetXElemetValue<int>(predictionex, "gust")
                    };

                    //輸出檔案(cap>typhinfo json)
                    string wf = Path.Combine(tdatap, tno + ".json");
                    JArray jas = null;
                    if (File.Exists(wf))
                        jas = DouHelper.Misc.DeSerializeObjectLoadJsonFile<JArray>(wf);
                    else
                        jas = new JArray();
                    //移除與目前cap資料同時間資料
                    JToken removejt = jas.FirstOrDefault(j => j["DateTime"].Value<DateTime>() == _Analysis.time);
                    if (removejt != null)
                        jas.Remove(removejt);

                    //觀測json
                    JToken jt = JToken.Parse("{}");
                    jas.Add(jt);
                    jt["Organization"] = "CWB";
                    jt["SerialNo"] = _Typh.no;
                    jt["EName"] = _Typh.typhoon_name;
                    jt["CName"] = _Typh.cwa_typhoon_name;
                    jt["WarnNo"] = _Analysis.warn_no;
                    jt["DateTime"] = _Analysis.time;
                    jt["Long"] = _Analysis.lon;
                    jt["Lat"] = _Analysis.lat;
                    jt["MaxWind"] = Convert.ToDouble(_Analysis.max_winds);
                    jt["Presure"] = _Analysis.pressure;
                    jt["Radius7"] = _Analysis.radius_of_15mps;
                    jt["Radius10"] = _Analysis.radius_of_25mps; 
                    jt["CurrPlace"] = _Analysis.current_place;
                    jt["MoveV"] = _Analysis.move;

                    //預報json(僅一筆)
                    JArray pjas = new JArray();
                    jt["PredDatas"] = pjas;
                    JToken pjt = JToken.Parse("{}");
                    pjas.Add(pjt);
                    pjt["Organization"] = "CWB";
                    pjt["DateTime"] = _Prediction.time;
                    pjt["Long"] = _Prediction.lon;
                    pjt["Lat"] = _Prediction.lat;
                    pjt["MaxWind"] = Convert.ToDouble(_Prediction.max_winds);
                    pjt["Presure"] = _Prediction.pressure;
                    pjt["Radius7"] = _Prediction.radius_of_15mps;
                    pjt["Radius10"] = _Prediction.radius_of_25mps;

                    DouHelper.Misc.SerializeObjectSaveJsonFile(jas, System.IO.Path.Combine(tdatap, $"{tno}.json"), System.Text.Encoding.Unicode);

                    //plus(以cwajson 資料將capjson補齊暴風半徑，及最後一筆的預報資料)
                    //var tempobj = cwajson.Value<JToken>("cwaopendata").Value<JToken>("dataset").Value<JToken>("tropicalCyclones").Value<object>("tropicalCyclone");
                    var tempobj = cwajson.SelectToken("cwaopendata.dataset.tropicalCyclones.tropicalCyclone");

                    var tropicalCyclones = tempobj is JArray ? tempobj as JArray: new JArray(tempobj); //有時Jarry有時Joken
                    var tropicalCyclone = tropicalCyclones.FirstOrDefault(s => s.Value<string>("typhoon_name") == _Typh.typhoon_name);
                    if (tropicalCyclone == null)
                        continue;
                    var _tn = tropicalCyclone.Value<string>("typhoon_name");
                    if (_tn == _Typh.typhoon_name)
                    {
                        //觀測
                        var tropicalCyclone_analysis_data = tropicalCyclone.Value<JToken>("analysis_data").Value<JArray>("fix");
                        //預報
                        var tropicalCyclone_forecast_data = tropicalCyclone.Value<JToken>("forecast_data").Value<JArray>("fix");
                        //補齊暴風半徑
                        foreach (var _jt in jas)
                        {
                            var _dt = _jt.Value<DateTime>("DateTime");
                            var _tct = tropicalCyclone_analysis_data.FirstOrDefault(j => j.Value<DateTime>("fix_time") == _dt);
                            if (_tct != null && _tct.HasValues)
                            {
                                if (_jt.Value<double?>("Radius7") == null)
                                {
                                    var temp = _tct.Value<JToken>("circleOf15Ms");
                                    if (temp != null && temp.HasValues)
                                    {
                                        _jt["Radius7"] = temp.Value<double>("radius");
                                    }
                                }
                                if (_jt.Value<double?>("Radius10") == null)
                                {
                                    var temp = _tct.Value<JToken>("circleOf25Ms");
                                    if (temp != null && temp.HasValues)
                                    {
                                        _jt["Radius10"] = temp.Value<double>("radius");
                                    }
                                }
                            }
                        }
                        //最新資料預報
                        var newjt = jas.Last();
                        var _newdt = newjt.Value<DateTime>("DateTime");
                        var _newps = newjt.Value<JArray>("PredDatas");
                        //_newps.Clear();//先清除，改以cwa json

                        JArray _pdats = new JArray();
                        if(tropicalCyclone_forecast_data.FirstOrDefault(j=>j.Value<DateTime>("init_time").AddHours(j.Value<int>("tau"))> _newdt) != null)
                            _newps.Clear();//先清除，改以cwa json
                        foreach (var _tfjt in tropicalCyclone_forecast_data)
                        {
                            var _pdt = _tfjt.Value<DateTime>("init_time").AddHours(_tfjt.Value<int>("tau"));
                            if (_pdt > _newdt)
                            {
                                JToken _pjt = JToken.Parse("{}");

                                _pjt["Organization"] = "CWB";
                                _pjt["DateTime"] = _pdt;
                                _pjt["Long"] = Convert.ToDouble(_tfjt.Value<string>("coordinate").Split(new char[] { ',' })[0]);
                                _pjt["Lat"] = Convert.ToDouble(_tfjt.Value<string>("coordinate").Split(new char[] { ',' })[1]);
                                var _maxwind = _tfjt.Value<string>("max_wind_speed");
                                if (_maxwind != null)
                                {
                                    _pjt["MaxWind"] = Convert.ToDouble(_maxwind);
                                }
                                var temp = _tfjt.Value<JToken>("circle_of_15ms");
                                if (temp != null && temp.HasValues)
                                {
                                    _pjt["Radius7"] = Convert.ToDouble(temp.Value<double>("radius"));
                                }
                                else //減弱為熱帶性低氣壓
                                    break;
                                temp = _tfjt.Value<JToken>("circle_of_25ms");
                                if (temp != null && temp.HasValues)
                                {
                                    _pjt["Radius10"] = Convert.ToDouble(temp.Value<double>("radius"));
                                }

                                _newps.Add(_pjt);
                            }
                        }
                       
                        DouHelper.Misc.SerializeObjectSaveJsonFile(jas, System.IO.Path.Combine(tdatap, $"{tno}_plus.json"), System.Text.Encoding.Unicode);
                    }

                    #region 新格式
                    
                    string nwf = Path.Combine(tdatap, tno + "_new.json");
                    Typh typh = null;
                    if (File.Exists(nwf))
                        typh = DouHelper.Misc.DeSerializeObjectLoadJsonFile<Typh>(nwf);
                    else
                        typh = _Typh;// new Typh { year= DateTime.Now.Year, no = tno, typhoon_name = _tname, cwa_typhoon_name= _tcname };
                    //移除與目前cap資料同時間資料
                    var rinfo = typh.analysis.FirstOrDefault(j => j.time == _Analysis.time);
                    if (rinfo != null) 
                        typh.analysis.Remove(rinfo); //用新資料
                    //觀測json
                    typh.analysis.Add(_Analysis);
                    //預報
                    _Analysis.predictions.Add(_Prediction);

                    DouHelper.Misc.SerializeObjectSaveJsonFile(typh, nwf, System.Text.Encoding.Unicode);
                    #endregion

                    #region 新格式 plus(以cwajson 資料將capjson補齊暴風半徑，及最後一筆的預報資料)
                    if (_tn == typh.typhoon_name)
                    {
                        //觀測
                        var tropicalCyclone_analysis_data = tropicalCyclone.Value<JToken>("analysis_data").Value<JArray>("fix");
                        //預報
                        var tropicalCyclone_forecast_data = tropicalCyclone.Value<JToken>("forecast_data").Value<JArray>("fix");
                        //補齊暴風半徑
                        foreach (var a in typh.analysis)
                        {
                            var _tct = tropicalCyclone_analysis_data.FirstOrDefault(j => j.Value<DateTime>("fix_time") == a.time);
                            if (_tct != null && _tct.HasValues)
                            {
                                    var temp = _tct.Value<JToken>("circleOf15Ms");
                                    if (temp != null && temp.HasValues)
                                    {
                                        a.radius_of_15mps = temp.Value<int>("radius");
                                    }
                                    temp = _tct.Value<JToken>("circleOf25Ms");
                                    if (temp != null && temp.HasValues)
                                    {
                                    a.radius_of_25mps = temp.Value<int>("radius");
                                }
                            }
                        }
                        //最新資料預報

                        var la = typh.analysis.Last();
                        //
                        if(tropicalCyclone_forecast_data.FirstOrDefault(j=> j.Value<DateTime>("init_time").AddHours(j.Value<int>("tau"))>la.time) != null)
                            la.predictions.Clear();//先清除，改以cwa json
                        foreach (var _tfjt in tropicalCyclone_forecast_data)
                        {
                            var _pdt = _tfjt.Value<DateTime>("init_time").AddHours(_tfjt.Value<int>("tau"));
                            if (_pdt > la.time)
                            {
                                TyphInfoPrediction tp = new TyphInfoPrediction();


                                tp.time = _pdt;
                                tp.lon = Convert.ToDouble(_tfjt.Value<string>("coordinate").Split(new char[] { ',' })[0]);
                                tp.lat = Convert.ToDouble(_tfjt.Value<string>("coordinate").Split(new char[] { ',' })[1]);
                                tp.max_winds = _tfjt.Value<int>("max_wind_speed");

                                var temp = _tfjt.Value<JToken>("circle_of_15ms");
                                if (temp != null && temp.HasValues)
                                {
                                    tp.radius_of_15mps = temp.Value<int>("radius");
                                }
                                else //減弱為熱帶性低氣壓
                                    break;
                                temp = _tfjt.Value<JToken>("circle_of_25ms");
                                if (temp != null && temp.HasValues)
                                {
                                    tp.radius_of_25mps = temp.Value<int>("radius");
                                }
                                tp.pressure = _tfjt.Value<int>("pressure");
                                tp.gust = _tfjt.Value<int>("max_gust_speed");

                                la.predictions.Add(tp);
                            }
                        }
                        DouHelper.Misc.SerializeObjectSaveJsonFile(typh, System.IO.Path.Combine(tdatap, $"{tno}_new_plus.json"), System.Text.Encoding.Unicode);
                    }
                    #endregion
                }
                //var sdds = "";
                //}
            },
            () => { return 30 * 60 * 1000; },
                1000
            ,
            (ex) => //Error
            {
                
                Debug.WriteLine(ex.ToString());
                WriteLog(typhErrLog, ex.Message);
            });
        }
        void WriteLog(string f, string msg)
        {
            System.IO.File.AppendAllText(f, $"{DateTime.Now.ToString("yyyy/MM/dd HH:mm:ss")}-{msg}{Environment.NewLine}", System.Text.Encoding.Unicode);
        }
        public class Typh
        {
            public Typh()
            {
                analysis = new List<TyphInfoAnalysis>();
                //predictions = new List<TyphInfoPrediction>();
            }
            public int year { set; get; }
            public string typhoon_name { set; get; }
            public string cwa_typhoon_name { set; get; }
            public string no { set; get; }
            public List<TyphInfoAnalysis> analysis { set;get;}
            //public List<TyphInfoPrediction> predictions { set; get; }
        }
        public class TyphInfoAnalysis:TyphInfo { 
            public TyphInfoAnalysis()
            {
                predictions = new List<TyphInfoPrediction>();
            }
            public string warn_no { set; get; }
            public string type { set; get; }
            public string scale { set; get; }
            public string current_place { set; get; }
            public string move { set; get; }
            [JsonProperty(Order = 1)]
            public List<TyphInfoPrediction> predictions { set; get; }
        }
        public class TyphInfoPrediction : TyphInfo
        {

        }
        public class TyphInfo
        {
            public  DateTime time { set; get; }
            public double lon { set; get; }
            public double lat { set; get; }
            public int max_winds { set; get; }
            public int gust { set; get; }
            public int pressure { set; get; }
            public int? radius_of_15mps { set; get; }
            public int? radius_of_25mps { set; get; }
        }
        //刪除過時資料
        void TodoDeleteExpiredLog()
        {
            Todo(DeleteExpiredLog, () => { return 60*60 * 1000; });
        }
    }
}