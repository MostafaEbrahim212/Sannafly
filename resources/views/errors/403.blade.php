@extends('errors.layout')
@section('code', '403')
@section('title', app()->getLocale() === 'ar' ? 'غير مصرح بالوصول' : 'Access Restricted')
@section('message', app()->getLocale() === 'ar' ? 'لا تملك الصلاحية الكافية لعرض هذه الصفحة.' : 'You do not have permission to view this page.')
