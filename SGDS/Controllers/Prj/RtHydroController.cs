using Dou.Misc.Attr;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SGDS.Controllers.Prj
{
    [MenuDef(Id = "RtHydro", Name = "即時監控", MenuPath = "情資查詢", Index = 3, Action = "Index", AllowAnonymous = false, Func = FuncEnum.None)]
    public class RtHydroController : NoModelController
    {
        // GET: RtHydro
        public ActionResult Index()
        {
            ViewBag.HasGis = true;
            ViewBag.Leaflet = true;
            ViewBag.ToolNearCctv = true;
            ViewBag.IncludeFloodPreventionPoint = true;
            return View();
        }
    }
}