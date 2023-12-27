using Dou.Misc.Attr;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SGDS.Controllers.Prj
{
    [MenuDef(Id = "DFAMap", Name = "人工圈畫範圍", MenuPath = "淹水範圍推估", Index = 1, Action = "Index", AllowAnonymous = false, Func = FuncEnum.None)]
    public class DFAMapController : NoModelController
    {
        // GET: ManualFlood
        public ActionResult Index()
        {
            ViewBag.HasGis = true;
            ViewBag.Leaflet = true;
            return View();
        }
    }
}