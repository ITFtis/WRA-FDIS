using Dou.Misc.Attr;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SGDS.Models.SixBox
{
    public class ScreenShot
    {
        [ColumnDef(Display ="時間", Filter = true, FilterAssign = FilterAssignType.Between)]
        public DateTime fileDate { set; get; }
        [ColumnDef(Display ="站名", Filter =true,EditType = EditType.TextList,TextListMatchValue =false, SelectItemsClassNamespace = StationNameSelectItemsClassImp.AssemblyQualifiedName)]
        public string stationName { set; get; }
       

        [ColumnDef(Display = "站名")]
        public string stationNameExt
        {
            get
            {
                if (String.IsNullOrEmpty(url))
                    return stationName;
                int s = url.IndexOf(stationName);
                int e = url.IndexOf(uuid);
                return url.Substring(s , e - s - 1);
            }
            
        }

        [ColumnDef(Display = "編碼", Filter = true, EditType = EditType.TextList, TextListMatchValue = true, SelectItemsClassNamespace = UuidSelectItemsClassImp.AssemblyQualifiedName)]
        public string uuid { set; get; }
        public string url { set; get; }

        public static List<ScreenShot> GetSixBoxScreenShot(DateTime? startDate, DateTime? endDate, string stationName,string uuid) {
            List<string> paras = new List<string>();    
            if(startDate != null)
                paras.Add($"startDate={startDate.Value.ToString("yyyy/MM/dd HH:mm")}");
            if (endDate != null)
                paras.Add($"endDate={endDate.Value.ToString("yyyy/MM/dd HH:mm")}");
            if(!String.IsNullOrEmpty(stationName))
                paras.Add($"stationName={stationName}");
            if (!String.IsNullOrEmpty(uuid))
                paras.Add($"uuid={uuid}");
            string parastr = paras.Count == 0 ? "" : ("?" + String.Join("&", paras));
            string q = $"{Startup.AppSet.WraJavaJob}SixBoxScreenShot/getFilterProperties{parastr}";
            var r = DouHelper.HClient.Get<List<ScreenShot>>(q).Result.Result;
            return r;
        }

        public static List<ScreenShot> GetAllStation()
        {
            string key = "!StationNameSelectItemsClassImp";
            lock (StationNameSelectItemsClassImpLock)
            {
                var r = DouHelper.Misc.GetCache<List<ScreenShot>>(5 * 60 * 1000, key);
                if (r == null)
                {
                    r = DouHelper.HClient.Get<List<ScreenShot>>(Startup.AppSet.WraJavaJob + "SixBoxScreenShot/getStations").Result.Result;
                    DouHelper.Misc.AddCache(r, key);
                }
                return r;
            }
        }
        static object StationNameSelectItemsClassImpLock = new object();
    }
    public class StationNameSelectItemsClassImp : SelectItemsClass
    {
        
        public const string AssemblyQualifiedName = "SGDS.Models.SixBox.StationNameSelectItemsClassImp, SGDS";


        public override IEnumerable<KeyValuePair<string, object>> GetSelectItems()
        {
            return ScreenShot.GetAllStation().Select(x => new KeyValuePair<string, object>(x.stationName, x.stationName)); ;
        }
    }
    public class UuidSelectItemsClassImp : SelectItemsClass
    {

        public const string AssemblyQualifiedName = "SGDS.Models.SixBox.UuidSelectItemsClassImp, SGDS";


        public override IEnumerable<KeyValuePair<string, object>> GetSelectItems()
        {
            return ScreenShot.GetAllStation().Select(x => new KeyValuePair<string, object>(x.uuid, x.uuid)); ;
        }
    }
}