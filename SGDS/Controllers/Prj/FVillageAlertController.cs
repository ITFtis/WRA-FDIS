using Dou.Misc.Attr;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SGDS.Controllers.Prj
{
    [MenuDef(Id = "FVillageAlert", Name = "村里淹水預警", MenuPath = "淹水預警", Index =1, Action = "Index", AllowAnonymous = false, Func = FuncEnum.None)]
    public class FVillageAlertController : NoModelController
    {
        // GET: FVillageAlert
        public ActionResult Index()
        {
            ViewBag.HasGis = true;
            ViewBag.Leaflet = true;
            return View();
        }
    }
}