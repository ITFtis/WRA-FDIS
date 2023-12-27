using Antlr.Runtime.Misc;
using Dou.Controllers;
using Dou.Misc.Attr;
using Dou.Models.DB;
using SGDS.Models.SixBox;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Web;
using System.Web.Mvc;
using System.Xml.Linq;
namespace SGDS.Controllers.Prj
{
    [MenuDef(Id = "SixBoxSSQuery", Name = "六宮格推播紀錄", MenuPath = "資料查詢", Index = 9, Action = "Index", Func = FuncEnum.None)]
    [AutoLogger]
    public class SixBoxSSQueryController : Dou.Controllers.AGenericModelController<ScreenShot>
    {
        // GET: SixBoxSSQuery
        public ActionResult Index()
        {
            return View();
        }

        protected override IModelEntity<ScreenShot> GetModelEntity()
        {
            return null;
        }
        protected override IEnumerable<ScreenShot> GetDataDBObject(IModelEntity<ScreenShot> dbEntity, params KeyValueParams[] paras)
        {
            if(paras.Where(s=>s.key== "columnsFilter").Count()==0)
                return Enumerable.Empty<ScreenShot>();
            var startDateStr = Dou.Misc.HelperUtilities.GetFilterParaValue(paras, "fileDate-Start-Between_");
            var endDateStr = Dou.Misc.HelperUtilities.GetFilterParaValue(paras, "fileDate-End-Between_");
            DateTime? startDate = null;
            DateTime? endDate = null;
            if (!String.IsNullOrEmpty(startDateStr))
                startDate = Convert.ToDateTime(startDateStr);
            if (!String.IsNullOrEmpty(endDateStr))
                endDate = Convert.ToDateTime(endDateStr);
            var stationName = Dou.Misc.HelperUtilities.GetFilterParaValue(paras, "stationName");
            var uuid = Dou.Misc.HelperUtilities.GetFilterParaValue(paras, "uuid");
            return ScreenShot.GetSixBoxScreenShot(startDate, endDate, stationName, uuid);

        }
    }
}