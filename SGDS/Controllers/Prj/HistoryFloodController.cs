using Dou.Misc.Attr;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SGDS.Controllers.Prj
{
    [MenuDef(Id = "HistoryFlood", Name = "歷史災情", MenuPath = "情資查詢", Index = 5, Action = "Index", AllowAnonymous = false, Func = FuncEnum.None)]
    public class HistoryFloodController : NoModelController
    {
        // GET: HistoryFlood
        public ActionResult Index()
        {
            ViewBag.HasGis = true;
            ViewBag.Leaflet = true;
            ViewBag.StatisticsData = true;
            return View();
        }
    }
}