using Antlr.Runtime.Misc;
using Dou.Misc.Attr;
using SGDS.Controllers.comm;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Security.Policy;
using System.Web;
using System.Web.Mvc;
using System.Xml.Linq;

namespace SGDS.Controllers.Prj
{
    //[MenuDef(Id = "ComplexMapNew", Name = "複合Map", MenuPath = "複合", Index = 1, Action = "Index", AllowAnonymous = true, Func = FuncEnum.None)]
    [MenuDef(Id = "ComplexMap", Name = "複合淹水警戒New", MenuPath = "淹水預警", Index = 5, Action = "Index",  Func = FuncEnum.None)]
    public class ComplexMapController : NoModelController
    {
        // GET: ComplexMap
        public ActionResult Index()
        {
            ViewBag.Leaflet = true;
            ViewBag.HasGis = true;
            return View();
        }
    }
}